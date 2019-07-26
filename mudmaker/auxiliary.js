// This code adopted from Allen Liu on Random Snippets
// http://www.randomsnippets.com/2008/02/21/how-to-dynamically-add-form-elements-via-javascript/
 
var counter = [ 1 , 1 , 1, 1, 1, 1, 1, 1, 1 , 1 , 1, 1, 1, 1, 1, 1,1 , 1 , 1, 1, 1, 1, 1, 1,1 , 1 , 1, 1, 1, 1, 1, 1,1 , 1 , 1, 1, 1, 1, 1, 1];

var nref = [ 0, 0, 0, 0 ];

var limit = 50;

function removeIt(elemId) {
    var elem=document.getElementById(elemId);
    elem.parentNode.removeChild(elem);
}

    

function addInput(divName,sectype,dnsorurl,i){

    if (counter[i] == limit)  {
        alert("You have gotten silly: you have reached the limit of adding "
	      + counter[i] + " inputs");
    }
    else {
	var names = sectype + "names[]";
	var port = sectype + "port[]";
	var lport = sectype + "portl[]";
	var proto = sectype + "proto[]";
	var init  = sectype + "init[]";
        var newdiv= document.createElement('span');
	var typefield;
	var pattern;
	var portdivname;
	var portldivname;
	var checkdivname;
	var seldivname;
	var onchange;
	var hidden;
	var any;
	var fieldinfo;
	var divid;

	divid= "ext-" + "i" + "-" + counter[i] + divName;
	newdiv.id=divid;

	if ( dnsorurl == 'dns' ) {
	    typefield="'text'";
	    pattern = " pattern='[a-z0-9.-]+\.[a-z]{2,3}$'";
	    readonly=0;
	} else if ( dnsorurl == 'url' ) {
	    typefield="'url'";
	    pattern = "";
	    readonly=0;
	} else {
	    typefield="'text'";
	    pattern="";
	    readonly=1;
	}

	portdivname= divid + counter[i] + 'portdiv';
	portldivname= divid + counter[i] + 'portdivl';
	checkdivname= divid + counter[i] + 'portdivc';
	checkid= checkdivname + "-id";
	selname= divid + counter[i] + 'sel';

	if ( divName == 'loclist' ) {
	    onchange=' ';
	    hidden ="' style='visibility: inherit' ";
	    any = '';
	    pattern = " ";
	    fieldinfo = 'readonly="" value="any" ';
	} else {
	    if ( divName == 'myctllist' ) {
	    onchange=' ';
	    hidden ="' style='visibility: inherit' ";
	    any = '';
	    pattern = " ";
	    fieldinfo = 'readonly="" value="(filled in by local admin)" ';
	    } else { 
		if (divName == 'mymanlist' ) {
		    onchange=' ';
		    hidden ="' style='visibility: inherit' ";
		    any = '';
		    pattern = " ";
		    fieldinfo = 'readonly="" value="(filled in by system)" ';
		}
		 else {
		     hidden="' style='visibility: hidden'";
		     any = "<option value='any'>Any</option>";
		     onchange=
			 "value='any' onchange=\"tcporudp('" + selname + "','" + portdivname + "');\"";
		     fieldinfo="maxlength='120'";
		 }
	    }
	}

        newdiv.innerHTML = 
            " <br><input type=" + typefield + "name='" + names  + "'" + pattern +
	    " size='40' " + fieldinfo + ">&nbsp;&nbsp;&nbsp;" +
	    " Protocol&nbsp;&nbsp;<select id='" + selname + "' name='" + proto + "'" +
	    onchange + ">" +
	    any +
	    "<option value='tcp'>TCP</option>" +
	    "<option value='udp'>UDP</option>" +
	    "</select>" + "&nbsp;<input type='button' value='-' " +
	    "onclick=\"removeIt('" + divid + "');\">" +
	    "<span id='" + portldivname + hidden + ">"
	    + "&nbsp;&nbsp;&nbsp;" + 
	    "<br>Local Port&nbsp; <input pattern='([0-9]{1,5}|any)' value='any' " +
	    "name='" + lport + "' style='width:60px'></span>" +
	    "<span id='" + portdivname + hidden + ">"
	    + "&nbsp;&nbsp;&nbsp;" + 
	    "Remote Port&nbsp; <input pattern='([0-9]{1,5}|any)' value='any' " +
	    "name='" + port + "' style='width:60px'></span>" +
	    "<span id='" + checkdivname + hidden + ">"
	    + "&nbsp;&nbsp;&nbsp;" + 
	    "Initiated by&nbsp; <select "  + "id='" + checkid + "' " +
             "value='any' onclick=\"localcheck('" + checkid + "','" + portldivname + "');\"" +
	    "name='" + init + "'>" +
	    "<option value='either'>Either</option>" +
	    "<option value='thing'>Thing</option>" +
	    "<option value='remote'>Remote</option>" +
	    "</select></span>";
	    

        document.getElementById(divName).appendChild(newdiv);
        counter[i]++;
    }
}

function tcporudp(selectid,portid) {
    var lport = portid + "l";
    var check = portid + "c";
    if (document.getElementById(selectid).value == 'any') {
	document.getElementById(portid).style.visibility='hidden';
	document.getElementById(lport).style.visibility='hidden';
	document.getElementById(check).style.visibility='hidden';
    } else {
	document.getElementById(portid).style.visibility='inherit';
	if (document.getElementById(selectid).value == 'udp' ) {
	    document.getElementById(lport).style.visibility='inherit';
	    document.getElementById(check).style.visibility='hidden';
	} else {
	    document.getElementById(check).style.visibility='inherit';
	    document.getElementById(lport).style.visibility='inherit';
	}
    }
}

function localcheck(one2check,lport) {
    if (document.getElementById(one2check).value == 'local') {
	document.getElementById(lport).style.visibility="hidden";
    } else {
	document.getElementById(lport).style.visibility="inherit";
    }
}

function yesnoCheck(outer,inner,refind) {
    var box = inner + "box";
    if (document.getElementById(box).checked ) {
        document.getElementById(outer).style.display = 'block';
        document.getElementById(inner).style.display = 'block';
	nref[refind]++;
    } else {
        document.getElementById(inner).style.display = 'none';
	
	nref[refind]--;
        if ( nref[refind] < 1 ) {
            document.getElementById(outer).style.display = 'none';
        }
    }
}

function toggleANIMA(anid,anspan) {
    if (document.getElementById(anid).value == 'Yes') {
	document.getElementById(anspan).style.display = 'inherit';
    } else {
	document.getElementById(anspan).style.display ='none';
    }
}
