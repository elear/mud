// This code adopted from Allen Liu on Random Snippets
// http://www.randomsnippets.com/2008/02/21/how-to-dynamically-add-form-elements-via-javascript/
 
var counter = [ 1 , 1 , 1, 1, 1, 1, 1, 1];

var nref = [ 0, 0, 0, 0 ];

var limit = 10;

function removeIt(elemId) {
    var elem=document.getElementById(elemId);
    elem.parentNode.removeChild(elem);
}

    

function addInput(divName,names,dnsorurl,proto,port,i){

    if (counter[i] == limit)  {
        alert("You have gotten silly: you have reached the limit of adding "
	      + counter[i] + " inputs");
    }
    else {
        var newdiv= document.createElement('span');;
	var minus=document.createElement('input');
	var typefield;
	var pattern;
	var portdivname;
	var seldivname;
	var onchange;
	var hidden;
	var any;
	var fieldinfo;
	var divid;

	divid= divName + i + "-" +  counter[i];
	newdiv.id=divid;
	minus.setAttribute("type","Button");
	minus.setAttribute("onClick","removeIt('" + divid + "');");
	minus.value="-";

	if ( dnsorurl == 'dns' ) {
	    typefield="'text'";
	    pattern = " pattern='[a-z0-9.-]+\.[a-z]{2,3}$'";
	} else {
	    typefield="'url'";
	    pattern = "";
	}

	portdivname= divid + 'portdiv' + counter[i];
	selname= divid + 'sel' + counter[i];

	if ( divName == 'locoutlist' || divName == 'locinlist' ) {
	    onchange=' ';
	    hidden ="' style='visibility: inherit' ";
	    any = '';
	    pattern = " ";
	    fieldinfo = 'readonly="" value="any" ';
	} else {
	    onchange=
		" onchange=\"tcporudp('" + selname + "','" + portdivname + "');\"";
	    hidden="' style='visibility: hidden'";
	    any = "<option value='any'>Any</option>";
	    fieldinfo="maxlength='120'";
	}

        newdiv.innerHTML = 
            " <br><input type=" + typefield + "name='" + names  + "'" + pattern +
	    " size='40' " + fieldinfo + ">&nbsp;&nbsp;&nbsp;" +
	    " Protocol&nbsp;&nbsp;<select id='" + selname + "' name='" + proto + "'" +
	    onchange + ">" +
	    any +
	    "<option value='tcp'>TCP</option>" +
	    "<option value='udp'>UDP</option>" +
	    "</select><span id='" + portdivname + hidden + ">"
	    + "&nbsp;&nbsp;&nbsp;" + 
	    "Port&nbsp; <input max='65535' min='0' name='" +
	    port + "' style='width:60px' type='number'></span>";
	    

        document.getElementById(divName).appendChild(newdiv);
	newdiv.appendChild(minus);
	
        counter[i]++;
    }
}

function tcporudp(selectid,portid) {
    if (document.getElementById(selectid).value == 'any') {
	document.getElementById(portid).style.visibility='hidden';
    } else {
	document.getElementById(portid).style.visibility='inherit';
    }
}

function yesnoCheck(one2check, outer,inner,refind) {
    if (document.getElementById(one2check).checked ) {
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