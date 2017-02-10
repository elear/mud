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
"ietf-acl:access-lists" : {
  "acl" : 
  
ACL_HEAD;
  
$downloadtext=<<< DOWNLOAD
<form method="POST" action="download.php">
  <p>Would you like to download this file?
  <input type="submit" value="Download">
  </p>
</form>
DOWNLOAD;
  
define("IS_LOCAL",1);
define("IS_MFG", 2);
define("IS_CONTROLLER", 3);
define("IS_CLOUD", 4);


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



define(IS_LOCAL,1);
define(IS_MFG, 2);
define(IS_CONTROLLER, 3);
define(IS_CLOUD, 4);


// add a line to an acl.  

$gotin = 0;
$gotout = 0;
$fail=0;	/* set if someone is screwing with us */


function addace($acename, $pdirect, $target, $proto, $port, $type,$idirect) {
  
  $ace="   {\n   " . '"rule-name" :' . '"' . $acename . '"' . ",\n" .
    '   "matches" : {';

  $ace = $ace . '"ietf-mud:direction-initiated": "' . $idirect . '",' . "\n";
  
  if ( $pdirect == "to-device" ) {
    $protmfrag = '"source-port-range"';
    } else {
    $protmfrag = '"destination-port-range"';
  }
  
  if ( strlen($target) > 120 ) {
    $fail=1;
    return('');
  }

  switch ($type) {
    case IS_LOCAL:
      $ace = $ace . '  "ietf-mud:local-networks" : [ null ]';
      break;
    case IS_CONTROLLER:
      // uri validator courtesy of...
      // https://www.sitepoint.com/community/t/url-validation-with-preg-match/3255/2
      if ( ! preg_match('/^(http|https):\\/\\/[a-z0-9_]+([\\-\\.]{1}[a-z_0-9]+)*\\.[_a-z]{2,5}'.'((:[0-9]{1,5})?\\/.*)?$/i',$target) &&
	   ! preg_match ("^urn:[a-z0-9][a-z0-9-]{0,31}:[a-z0-9()+,\-.:=@;\$_!*'%/?#]+$^", $target)) {
	$fail=1;
	return('');
      }
      $ace = $ace . '      "ietf-mud:controller" : "' . $target . '"';
      break;
    case IS_CLOUD:
      if ( $pdirect == "to-device" ) {
	$ace = $ace . '"ietf-acldns:src-dnsname": "';
      } else {
	$ace = $ace . '"ietf-acldns:dst-dnsname": "';
      }
      $ace = $ace . $target . '"'; /* add host to ACE */
      break;
    case IS_MFG:
      if ( ! preg_match('/[a-z0-9.-]+\.[a-z]{2,3}$/',$target)) {
        $fail=1;
        return('');
      }
      $ace = $ace . '      "ietf-mud:manufacturer" : "' . $target . '"';
      break;
  }
  
    /* in both cases we left off the comma because we don't know if there
     * is another line, so... */

    if ( $proto != 'any' ) {
      if ( $proto == 'tcp' ) {
	$np = '6';
      } else {
	if ( $proto == 'udp') {
	  $np = '17';
	}
	else {
	  $fail=1;
	  return('');
	  
	}
      }
      $protbfrag = ",\n" . ' "protocol" : ' . $np . ",\n";
      $protefrag = " : {\n" . '"lower-port" : ' . $port . ",\n" .
	'      "upper-port" : ' . $port . "\n }";
      
      $ace = $ace . $protbfrag . $protmfrag . $protefrag;
    }
    

    /* now close off matches, add action to the ACE and return it. */
    
    $ace = $ace . "\n }, " . '"actions" : {' . "\n " .
      '"permit" : [null]' . "\n  }\n   }\n";
    return($ace);
}
               


function buildacegroup(&$target, &$proto, &$portarray, $namehead,$type,$direction) 
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
  for ($i = 0; isset($proto[$i]); $i++)
    {
      // for each outbound connection build two ACEs, one for the inbound ACL and
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
	  if (! is_numeric($port) ) {
	    $fail=1;
	    return;
	  }
	  if ( $port < 0 || $port > 65535 ) {
	    $fail=1;
	    return;
	  }
	}
	else {
	  $fail=1;
	  return;
	}
      }
      
      $s1= $namehead  . $i . "-out" ;
      $s2= $namehead . $i . "-in";
      
      /* a little kludge here.  if we are dealing with local networks
       * then $target is = FALSE.
       */

      if ( $type == IS_LOCAL ) {
	$t2 = 'local';
      } else {
	$t2= $target[$i];
      }
      
      
      
      $outbound = $outbound . addace($s1,"from-device", 
				     $t2, $proto[$i],
				     $port, $type,$direction);
      
      $inbound = $inbound . addace($s2,"to-device",
				     $t2, $proto[$i],
				   $port, $type,$direction);
    }
}

  
$inbound="";
$outbound="";
    
  
// We start by processing outbound cloud communications

if ( isset($_POST['cloutbox'] ) ) {
  // build based on cloud outbound

  if (isset($_POST['clportout']))  { // distinctly possible user didn't enter ports
    $clportout= $_POST['clportout'];
  } else {
    $clportout= FALSE;
  }
  
  buildacegroup($_POST['clnamesout'],$_POST['clprotoout'],$clportout,
		"clout",IS_CLOUD,"from-device");

}


// Next cloud inbound communications

if ( isset($_POST['clinbox'] )) {
  // build based on cloud inbound

  if (isset($_POST['clportin'])) {
    $clportin =  $_POST['clportin'];
  } 
  else {
    $clportin = FALSE;
  }

  buildacegroup($_POST['clnamesin'],$_POST['clprotoin'],$clportin,
		"clin",IS_CLOUD,"to-device");
}



// Next enterprise outbound

if ( isset($_POST['entoutbox'] )) {
  // build based on enterprise outbound
  
  if (isset($_POST['entportout']))  {
    // distinctly possible user didn't enter ports   
    $entportout= $_POST['entportout'];
    
  } else {
    $entportout= FALSE;
  }
  
  buildacegroup($_POST['entctrlout'],$_POST['entprotoout'],$entportout,
		"entout",IS_CONTROLLER,"from-device");
}

// enterprise inbound
if ( isset($_POST['entinbox'] )) {
  // build based on enterprise inbound
  if (isset($_POST['entportin']))  {
    $entportout= $_POST['entportin'];    
  }
  else {
    $entportout= FALSE;
  }

  buildacegroup($_POST['entctrlin'],$_POST['entprotoin'],$entportin,
		"entin",IS_CONTROLLER,"to-device");
}

// local services

if ( isset($_POST['localoutbox'])) {
  // build local outbound services.
  buildacegroup($_POST['localout'], $_POST['locprotoout'], $_POST['locportout'],
		"locout",IS_LOCAL,"from-device");
}

if ( isset($_POST['localinbox'])) {
  // build local inbound services.
  buildacegroup($_POST['localin'], $_POST['locprotoin'], $_POST['locportin'],
		"locin",IS_LOCAL,"to-device");
}

// Same manufacturer

if ( isset($_POST['maninbox'])) {
  // build local inbound services.
  buildacegroup($_POST['mannamesin'], $_POST['manprotoin'], $_POST['manportin'],
		"manin",IS_MFG,"to-device");
}
if ( isset($_POST['manoutbox'])) {
  // build local inbound services.
  buildacegroup($_POST['mannamesout'], $_POST['manprotoout'], $_POST['manportout'],
		"manout",IS_MFG,"from-device");
}


  $choice=$_POST['ipchoice'];
  if ( $choice != 'ipv4' && $choice != 'ipv6' && $choice != 'both' ) {
    $fail=1;
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

  $supportInfo = '"ietf-mud:meta-info": { "lastUpdate" : "' . $time . '",' . "\n" .
  $masa . '"systeminfo": "' . $sysDesc . '",' . "\n" .
  '"cacheValidity" : 1440 },';
  $output = "{\n". $supportInfo . "\n" . $aclhead;


  $mudname="mud-" . rand(10000,99999) . "-";

  if ( $choice == "ipv4" || $choice == "both" ) {
  $ipv4inbound = '[ { "acl-name" : "' . $mudname . "v4in" . '",' . "\n" .
    '"acl-type" : "ipv4-acl",' . "\n" .
    '"ietf-mud:packet-direction" : "to-device",' .
    "\n" . '"access-list-entries" : {' . '"ace" : [';
  $ipv4outbound = ' { "acl-name" : "' . $mudname . "v4out" . '",' . "\n" .
     '"acl-type" : "ipv4-acl",' . "\n" .
     '"ietf-mud:packet-direction" : "from-device",' .
     "\n" . '"access-list-entries" : {'  . '"ace" : [';
  $ipv4inbound= $ipv4inbound . $inbound . " ]}},\n";
  $ipv4outbound= $ipv4outbound . $outbound . " ]}}\n";
  $output = $output . $ipv4inbound . $ipv4outbound;
  
    }

  if ( $choice == "ipv6" || $choice == "both" ) {
    $ipv6inbound = '[ { "acl-name" : "' . $mudname . "v6in" . '",' . "\n" .
       '"acl-type" : "ipv6-acl",' . "\n" .
       '"ietf-mud:packet-direction" : "to-device",' .
       "\n" . '"access-list-entries" : {' . '"ace" : [';
    $ipv6outbound = ' { "acl-name" : "' . $mudname . "v6out" . '",' . "\n" .
      '"acl-type" : "ipv6-acl",' . "\n" .
      '"ietf-mud:packet-direction" : "from-device",' .
      "\n" . '"access-list-entries" : {' . '"ace" : [';
    $ipv6inbound= $ipv6inbound . $inbound . " ]}},\n";
    $ipv6outbound= $ipv6outbound . $outbound . "]}}\n";

    if ( $choice == 'both' ) {
      $output = $output . ",";
    }
    $output = $output . $ipv6inbound . $ipv6outbound;
  }
  
  $output = $output . "]}}";
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