<?php
  session_start();
?>

<?php
/* Copyright (c) 2016, Cisco Systems
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/*
 * Take a few inputs and generate a MUD file.
 *
 * All components are optional.
 * We will build two access lists: inbound and outbound.
 * There are two directions in which communications can be initiated: to device
 * and from device.  We allow the specified port outbound as a destination port
 * and inbound as a source port when the device initiates.  We allow the specified
 * port inbound as a destination port and outbound as a source port when others
 * initiate.  
 */

use \DateTime;

$aclhead= <<< ACL_HEAD
"ietf-access-control-list:access-lists" : {
  "acl" : 
  
ACL_HEAD;
  
$downloadtext=<<< DOWNLOAD
<form method="POST" action="download.php">
  <p>Would you like to download this file?
  <input type="submit" value="Download">
  </p>
</form>
DOWNLOAD;
  
$actxt0=<<< ACTXT0

  "ietf-mud:mud" : {
    "mud-version" : 1,
ACTXT0;
        

$actxt1=<<<  ACTXT1

    "from-device-policy" : {
        "access-lists" : {
            "access-list" : [

ACTXT1;

$actxt1a=<<< ACTXT1A
            ] 
        }
    },
    "to-device-policy" : {
      "access-lists" : {
            "access-list" : [
ACTXT1A;
                

$actxt2=<<< ACTXT2
                   ]
                 }
        }
},
ACTXT2;


define("IS_LOCAL",1);
define("IS_MFG", 2);
define("IS_CONTROLLER", 3);
define("IS_CLOUD", 4);
define("IS_MY_CONTROLLER", 5);
define("IS_MYMFG", 6);

  

/* Rather than try to pretty print the json throughout, I have 
 * borrowed some code from Kendall Hopkins and George Garchagudashvili
 * from stackoverflow at the following URL:
 *  http://stackoverflow.com/questions/6054033/pretty-printing-json-with-php
 *
 * Yes, this means that [null] looks a little weird.
 */



function prettyPrint( $json )
{
  $result = '';
  $level = 0;
  $in_quotes = false;
  $in_escape = false;
  $ends_line_level = NULL;
  $json_length = strlen( $json );

  for( $i = 0; $i < $json_length; $i++ ) {
    $char = $json[$i];
    $new_line_level = NULL;
    $post = "";
    
    if( $ends_line_level !== NULL ) {
      $new_line_level = $ends_line_level;
      $ends_line_level = NULL;
    }
    
    if ( $in_escape ) {
      $in_escape = false;
    }
    else if( $char === '"' ) {
      $in_quotes = !$in_quotes;
    }
    else if( ! $in_quotes ) {
      switch( $char ) {
      case '}': case ']':
	$level--;
	$ends_line_level = NULL;
	$new_line_level = $level;
	break;

      case '{': case '[':
	$level++;
	
      case ',':
	$ends_line_level = $level;
	break;

      case ':':
	$post = " ";
	break;
	
      case " ": case "\t": case "\n": case "\r":
	$char = "";
	$ends_line_level = $new_line_level;
	$new_line_level = NULL;
	break;
      }
    }
    else if ( $char === '\\' ) {
      $in_escape = true;
    }
    
    if( $new_line_level !== NULL ) {
      $result .= "\n".str_repeat( "  ", $new_line_level );
    }
    $result .= $char.$post;
  }

  return $result;
  
}



// add a line to an acl.  

$gotin = 0;
$gotout = 0;
$fail=0;	/* set if someone is screwing with us */

function errorexit($errstr)  {
    
  print "<!DOCTYPE html>\n<html>\n<body>\n";

  print "<h1>Error</h1>";
  print "<p>";
  print $errstr;
  print "</p><p>Please click back and correct.</p>";
  print "</body></html>";
  exit;
}
  
function mkportrange($rname,$port, $dirinit) {
    if ( $port == 'any' ) {
        return "";
    }
    $frag='';
    
    if ( $dirinit == "thing" || $dirinit == "remote" ) {
        $frag = ',';
    }
    
    $frag = $frag . '"' . $rname . '"  :  ' . 
    "{\n" . '"operator" : "eq" ' . ",\n" .
    ' "port" : ' . $port . "\n }";
    return $frag;
}
  

function addace($acename, $pdirect, $target, $proto, $lport, $port, $type,$dirinit) {
  

  $openacl='';

  $ace="   {\n   " . '"name" :' . '"' . $acename . '"' . ",\n" .
    '   "matches" : {';

  $clfrag = '';
  $l4frag = '';

  if ( strlen($target) > 120 ) {
    errorexit("string too long: " . $target);
  }

  switch ($type) {
    case IS_LOCAL:
      $ace = $ace . '  "ietf-mud:mud" : { "local-networks" : [ null ] }';
      break;
    case IS_MY_CONTROLLER:
      $ace = $ace . '  "ietf-mud:mud" : { "my-controller" : [ null ] }';
      break;
    case IS_CONTROLLER:
      // uri validator courtesy of...
      // https://www.sitepoint.com/community/t/url-validation-with-preg-match/3255/2
      if ( ! preg_match('/^(http|https):\\/\\/[a-zA-Z0-9_]+([\\-\\.]{1}[a-zA-Z_0-9]+)*\\.[_a-zA-Z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i',$target) &&
	   ! preg_match ("^urn:[a-zA-Z0-9][a-zA-Z0-9-]{0,31}:[a-zA-Z0-9()+,\-.:=@;\$_!*'%/?#]+$^", $target)) {
	errorexit("Not a valid URL: " . $target);
      }
      $ace = $ace . '      "ietf-mud:mud": { "controller" : "' . $target . '" }';
      break;
    case IS_CLOUD:
      if ( ! preg_match('/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/',$target)) {
	errorexit("Not a domain name: " . $target);
      }
    
      if ( $pdirect == "to-device" ) {
          $clfrag = '"ietf-acldns:src-dnsname": "';
      } else {
          $clfrag = '"ietf-acldns:dst-dnsname": "';
      }
    $clfrag = $clfrag . $target . '"'; /* this becomes an l3 component */
    
      break;
    case IS_MFG:
        if ( ! preg_match('/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/',$target)) {
            errorexit("Not a domain name: " . $target);
        }
        $ace = $ace . '      "ietf-mud:mud" : { "manufacturer" : "' . $target . '" }';
        break;
    case IS_MYMFG:
        $ace = $ace . '     "ietf-mud:mud" : { "same-manufacturer" : [ null ]}';
        break;
    
  }
  
    /* in both cases we left off the comma because we don't know if there
     * is another line, so... */

  if ( $proto == 'any' ) { /* just close off the cloud bit (if necessary) */
      if ( $type == IS_CLOUD ) {
          $l3frag = '"ipv4" : { ' . $clfrag . '}';
          $ace = $ace . $l3frag;

      }
  } else { // tcp or udp

      // create an l3frag and add protocol info.
      $l3frag = '"ipv4" : { ';
      if ( $type == IS_CLOUD ) {
          $l3frag = $l3frag . $clfrag . ",";
          $addcomma='';
      } else {
          $l3frag = ',' . $l3frag;
      }
      
      if ( $proto == "tcp" ) {
          $l3frag = $l3frag . '"protocol" : 6 },'; 
      } else {
          $l3frag = $l3frag . '"protocol" : 17 },';
      }
      $ace = $ace . $l3frag;
      $l4frag="";
      
      $endfrag = '}';
      if ( $proto == 'tcp' ) {
          $l4frag = $l4frag . '"tcp" : {';
          if ( $dirinit == 'thing' ) {
              $l4frag= $l4frag . '"ietf-mud:direction-initiated" : "from-device"';
          } else {
              if ( $dirinit == "remote" ) {
              $l4frag= $l4frag . '"ietf-mud:direction-initiated" : "to-device"';
              }
          }
      } else {
          $l4frag = $l4frag . '"udp" : {';
      }
      
      $pfrag='';
      
  if ( $pdirect == "to-device"  ) {
      
      $pfrag= mkportrange("source-port",$port, $dirinit);
      $pfrag= $pfrag . mkportrange("destination-port",$lport) ;
  } else {
      $pfrag=mkportrange("destination-port",$port, $dirinit);
      $pfrag=$pfrag . mkportrange("source-port",$lport);
  }
      
      if ( strlen($pfrag) > 0 || $dirinit == 'thing' ||
          $dirinit == 'remote' ) {
          $ace = $ace . $l4frag . $pfrag . $endfrag;
      }
      
  
  }
  
  
  

    /* now close off matches, add action to the ACE and return it. */
    
    $ace = $ace . "\n }, " . '"actions" : {' . "\n " .
      '"forwarding" : "accept"' . "\n  }\n   }\n";
    return($ace);
}
               
  function checkportrange($p) {

      if ( $p != 'any' ) {
          if ( (! is_numeric($p)) || ( $p < 0 || $p > 65535 )) {
              errorexit('Invalid port range: use "any" or 0 - 65536');
          }
      }
}
  

function buildacegroup(&$target, &$proto, &$portl, &$portarray,
                       &$dirinit,  $namehead,$type) 
{
  global $inbound, $outbound, $gotin, $gotout;

  if ( $gotin > 0 ) {
    $inbound = $inbound . ",";
  } else {
    $gotin=1;
  }
  
  if ( $gotout > 0) {
    $outbound = $outbound . ",";
  } else {
    $gotout = 1;
  }

  // loop through all entries in array
  // we can rely on proto as being set to SOME value...

  for ($i = 0; isset($proto[$i]); $i++)
    {
      // for each line build two ACEs, one for the inbound ACL and
      // one for the outbound ACL.
      
      if ( $target[$i] == '' ) { // there may be no there there, especially on 0.
          continue;
      }
      
      if ( $i > 0 ) {
          $outbound = $outbound . "  ,\n";
          $inbound = $inbound . "  ,\n";
      }

      if ( $proto[$i] == 'any' ) {
          $port = FALSE;
      } else {
          if ( $proto[$i] == 'udp' || $proto[$i] == 'tcp') {
              $port = $portarray[$i];
      
              checkportrange($port);
              checkportrange($portl[$i]);
          }
          else {
              errorexit("unsupported protocol");
          }
      }
      if ( $proto[$i] != 'tcp' && $dirinit[$i] != 'either' ) {
          errorexit("direction initiated requires TCP");
      }
      
      
      $s1= $namehead  . $i . "-frdev" ;
      $s2= $namehead . $i . "-todev";
      
      /* a little kludge here.  if we are dealing with local networks
       * then $target is = FALSE.
       */

      if ( $type == IS_LOCAL ) {
          $t2 = 'local';
      } else {
          $t2= $target[$i];
      }
      
      $outbound = $outbound . addace($s1,"from-device", 
                     $t2, $proto[$i],$portl[$i],
				     $port, $type,$dirinit[$i]);
      
      $inbound = $inbound . addace($s2,"to-device",
                   $t2, $proto[$i], $portl[$i],
				   $port, $type,$dirinit[$i]);
    }
}


  
$inbound="";
$outbound="";
    
$choice=$_POST['ipchoice'];

if ( $choice != 'ipv4' && $choice != 'ipv6' && $choice != 'both' ) {
  errorexit("No IP version chosen");
}
  
// We start by processing cloud communications

if ( isset($_POST['clbox'] ) ) {
  // build based on cloud outbound

  if (isset($_POST['clport']))  { // distinctly possible user didn't enter ports
    $clport= $_POST['clport'];
  } else {
    $clport= FALSE;
  }
  
  buildacegroup($_POST['clnames'],$_POST['clproto'],$_POST['clportl'],$clport,
      $_POST['clinit'], "cl",IS_CLOUD);

}



// Next controller (enterprise)

if ( isset($_POST['entbox'] )) {
  // build based on enterprise outbound
  
  if (isset($_POST['entproto']))  {
    // distinctly possible user didn't enter ports   
    $entport= $_POST['entport'];
    
  } else {
    $entport= FALSE;
  }
  
  buildacegroup($_POST['entnames'],$_POST['entproto'],$_POST['entportl'],$entport,
      $_POST['entinit'], "ent",IS_CONTROLLER);

}

// my-controller 

  if (isset($_POST['myctlport']))  {
    // distinctly possible user didn't enter ports   
    $myctlport= $_POST['myctlport'];
    
  } else {
    $myctlport= FALSE;
  }
  if ( isset($_POST['myctlbox']) ) {
    // build my-controller
      
      buildacegroup($_POST['myctlnames'],$_POST['myctlproto'],$_POST['myctlportl'],
      $myctlport, $_POST['myctlinit'], "myctl",IS_MY_CONTROLLER);
  }

// local services

if ( isset($_POST['locbox'])) {
  // build local outbound services.
    
  buildacegroup($_POST['locnames'],$_POST['locproto'],$_POST['locportl'],
     $_POST['locport'], $_POST['locinit'], "loc",IS_LOCAL);
}

// manufacturer

if ( isset($_POST['manbox'])) {
  // build local inbound services.
  buildacegroup($_POST['mannames'],$_POST['manproto'],$_POST['manportl'],
     $_POST['manport'], $_POST['maninit'], "man",IS_MFG);
}

// my-manufacturer
if ( isset($_POST['mymanbox'])) {
  // build local inbound services.
  buildacegroup($_POST['mymannames'],$_POST['mymanproto'],$_POST['mymanportl'],
     $_POST['mymanport'], $_POST['mymaninit'], "myman",IS_MYMFG);

}



if ( $fail ) {
  exit;
}



  
  
if ( $gotin > 0 || $gotout > 0 ) {
  $d=new Datetime('NOW');
  $time=$d->format(DATE_RFC3339);

  if ( $_POST['anbox'] == 'Yes' && preg_match('/^(http|https):\\/\\/[a-z0-9_]+([\\-\\.]{1}[a-z_0-9]+)*\\.[_a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i',$_POST['masa']) ) {
    $masa = '"masa-server" : "' . $_POST['masa'] . '",' . "\n";
  } else {
    $masa = '';
  }
  $sysDesc=htmlspecialchars($_POST['sysDescr'],ENT_QUOTES);
  $mudurl= "https://" . htmlspecialchars($_POST['mudhost'],ENT_QUOTES) .
  '/' . htmlspecialchars($_POST['mudfilename'],ENT_QUOTES);
  
  $supportInfo = $actxt0 . '"mud-url" : "' . $mudurl . '",  "last-update" : "' . $time . '",' . "\n" .

  '"cache-validity" : 48,' .
  '"is-supported" : true,' . "\n" .
  $masa . '"systeminfo": "' . $sysDesc . '",' . "\n";
  
  $devput = "{\n". $supportInfo . "\n";

  $mudname="mud-" . rand(10000,99999) . "-";
  $v4in = $mudname . "v4to";
  $v4out = $mudname . "v4fr";
  $v6in  = $mudname . "v6to";
  $v6out = $mudname . "v6fr";

  $pre4in='';
  $pre4out='';
  $pre6in='';
  $pre6out='';
  $output='';
  

  
  if ( $choice == "ipv4" || $choice == "both" ) {
      $pre4in = '{ "name" : "' . $v4in . '" ' . "\n" . ' }' . "\n";
      $pre4out =  '{ "name" : "' . $v4out . '" ' . "\n" .  ' }' . "\n";
      $ipv4inbound = '[ { "name" : "' . $v4in . '",' . "\n" .
          '"type" : "ipv4-acl-type",' .
          "\n" . '"aces" : {' . '"ace" : [';
      $ipv4outbound = ' { "name" : "' . $v4out . '",' . "\n" .
          '"type" : "ipv4-acl-type",'  .
          "\n" . '"aces" : {'  . '"ace" : [';
      $ipv4inbound= $ipv4inbound . $inbound . " ]}},\n";
      $ipv4outbound= $ipv4outbound . $outbound . " ]}}\n";
      $output = $output . $ipv4inbound . $ipv4outbound;
  
    }

  if ( $choice == "ipv6" || $choice == "both" ) {
      $pre6in = '{ "name" : "' . $v6in . '"' . "\n" . '}';
      $pre6out =  '{ "name" : "' . $v6out . '"' . "\n" . '}';
      if ( $choice == "ipv6" ) {
          $ipv6inbound = "[ ";
      } else {
          $ipv6inbound = "";
      }
      $ipv6inbound = $ipv6inbound . '{ "name" : "' . $v6in . '",' . "\n" .
      '"type" : "ipv6-acl-type",' . "\n" .
      '"aces" : {' . '"ace" : [';
      $ipv6outbound = ' { "name" : "' . $v6out . '",' . "\n" .
      '"type" : "ipv6-acl-type",' .
      "\n" . '"aces" : {' . '"ace" : [';
      $ipv6inbound= $ipv6inbound . str_replace("ipv4","ipv6",$inbound) . " ]}},\n";
      $ipv6outbound= $ipv6outbound . str_replace("ipv4","ipv6",$outbound) . "]}}\n";
    
      if ( $choice == 'both' ) {
          $output = $output . ",";
      }
      $output = $output . $ipv6inbound . $ipv6outbound;
  }
  

  $devput = $devput . $actxt1 . $pre4out;

  $comma="";
  
  if ( $choice == 'both' ) {
      $comma=", ";
  }
  if ( $choice == 'ipv6' || $choice == "both" ) {

      $devput = $devput . $comma . $pre6out;
  }
      
  $devput = $devput . $actxt1a . $pre4in;
  
  if ( $choice == 'ipv6' || $choice == "both" ) {
      $devput = $devput . $comma . $pre6in;
  }
  
  $devput = $devput . $actxt2;
  
  $output = $devput . $aclhead . $output . "]}}";
  $output= prettyPrint($output);

  session_unset();
  $_SESSION['mudfile'] = $output;
  
  print "<!DOCTYPE html>\n<html>\n<body>\n";

  print "<h1>Your MUD file is ready!</h1>";
  print "<p>Congratulations!  You've just created your first MUD file.  Simply ";
  print "Cut and paste beween the lines and stick into a file.  Your next steps ";
  print "are to sign the file and place it in the location that its corresponding ";
  print "MUD URL will find.</p>";
  print $downloadtext;

  print "<hr>\n";
  print "<pre>" . htmlentities($output) . "</pre>";
  print "<hr>\n";
} else {
  
  print "<h1>No output selected.  Click back and try again</h1>";
}
  print "</body>\n</html>";

?>
