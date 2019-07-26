// =============================
// PRINTING DEVICE DETAILS TABLE
// =============================

// ====================
// READING OF JSON FILE 
// ====================
// function readTextFile(file, callback) {
//   var rawFile = new XMLHttpRequest();
//   rawFile.overrideMimeType("application/json");
//   rawFile.open("GET", file, true);
//   rawFile.onreadystatechange = function () {
//     if (rawFile.readyState === 4 && rawFile.status == "200") {
//       callback(rawFile.responseText);
//     }
//   }
//   rawFile.send(null);
// }

// function OnClickDetails(deviceid) {
//   //alert("devicedetails: " + deviceid);
//   //usage:

//   // #############################
//   // # READING NEIGHBORS         #
//   // #############################  
//   readTextFile("python/neighborships.json", function (text) {
//     var data = JSON.parse(text);
//     console.log(data);
//     console.log(deviceid);

//     bFoundMatch = 0;
//     for (var key in data) {
//       console.log("Key: " + key + " vs " + deviceid);

//       if ((deviceid.localeCompare(key)) == 0) {
//         console.log("match!");
//         bFoundMatch = 1;
//         text = tableFromNeighbor(key, data);

//         printToDivWithID("infobox", "<h2><u>" + key + "</u></h2>" + text);
//       }
//     }
//     if (!(bFoundMatch)) {
//       warning_text = "<h4>The selected device id: ";
//       warning_text += deviceid;
//       warning_text += " is not in database!</h4>";
//       warning_text += "This is most probably as you clicked on edge node ";
//       warning_text += "that is not NETCONF data gathered, try clicking on its neighbors.";
//       printToDivWithID("infobox", warning_text);
//     }
//   });

//   // ####################################
//   // # READING NEIGHBOR-LESS INTERFACES #
//   // ####################################
//   readTextFile("python/no_neighbor_interfaces.json", function (text) {
//     var data = JSON.parse(text);
//     console.log(data);
//     console.log(deviceid);

//     bFoundMatch = 0;
//     for (var key in data) {
//       console.log("Key: " + key + " vs " + deviceid);

//       if ((deviceid.localeCompare(key)) == 0) {
//         console.log("match!");
//         bFoundMatch = 1;
//         text = tableFromUnusedInterfaces(key, data);
//         printToDivWithID("infobox2", "<font color=\"red\">Enabled Interfaces without LLDP Neighbor:</font><br>" + text);
//       }
//     }
//     if (!(bFoundMatch)) {
//       printToDivWithID("infobox2", "");
//     }
//   });
// }

// ####################################
// # using input parameters returns 
// # HTML table with these inputs
// ####################################
// function tableFromUnusedInterfaces(key, data) {
//   text = "<table class=\"infobox2\">";
//   text += "<thead><th><u><h4>LOCAL INT.</h4></u></th><th><u><h4>DESCRIPTION</h4></u></th><th><u><h4>Bandwith</h4></u></th>";
//   text += "</thead>";

//   for (var neighbor in data[key]) {
//     text += "<tr>";

//     console.log("local_intf:" + data[key][neighbor]['local_intf']);
//     text += "<td>" + data[key][neighbor]['local_intf'] + "</td>";
//     console.log("description:" + data[key][neighbor]['description']);
//     text += "<td>" + data[key][neighbor]['description'] + "</td>";
//     console.log("actual_bandwith:" + data[key][neighbor]['actual_bandwith']);
//     text += "<td>" + data[key][neighbor]['actual_bandwith'] + "</td>";

//     text += "</tr>";
//   }

//   text += "</table>";

//   return text;
// }

// ####################################
// # using input parameters returns 
// # HTML table with these inputs
// ####################################
// function tableFromNeighbor(key, data) {
//   text = "<table class=\"infobox\">";
//   text += "<thead><th><u><h4>LOCAL INT.</h4></u></th><th><u><h4>NEIGHBOR</h4></u></th><th><u><h4>NEIGHBOR'S INT</h4></u></th>";
//   text += "</thead>";

//   for (var neighbor in data[key]) {
//     text += "<tr>";

//     console.log("local_intf:" + data[key][neighbor]['local_intf']);
//     text += "<td>" + data[key][neighbor]['local_intf'] + "</td>";
//     console.log("neighbor_intf:" + data[key][neighbor]['neighbor_intf']);
//     text += "<td>" + data[key][neighbor]['neighbor'] + "</td>";
//     console.log("neighbor:" + data[key][neighbor]['neighbor']);
//     text += "<td>" + data[key][neighbor]['neighbor_intf'] + "</td>";

//     text += "</tr>";
//   }

//   text += "</table>";

//   return text;
// }

// ####################################
// # replaces content of specified DIV
// ####################################
// function printToDivWithID(id, text) {
//   div = document.getElementById(id);
//   div.innerHTML = text;
// }

// ########
// # MAIN #
// ########
// var svg = d3.select("svg"),
//   //width = +svg.attr("width"),
//   //height = +svg.attr("height");
//   width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
//   height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
// d3.select("svg").attr("height", height)
// d3.select("svg").attr("width", width)



function mud_drawer(inp_json) {
var graph = JSON.parse(JSON.stringify(inp_json));
var svg = d3.select("svg"),
  //width = +svg.attr("width"),
  //height = +svg.attr("height");
  width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
  height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

d3.select("svg").attr("height", height)
d3.select("svg").attr("width", width)

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(100).strength(0.001))
  .force("charge", d3.forceManyBody().strength(-200).distanceMax(500).distanceMin(50))
  .force("x", d3.forceX(function (d) {
    if (d.group === "1" || d.group == "0") {
      return 4 * (width) / 5
    } else if (d.group === "2") {
      return 3 * (width) / 5
    } else if (d.group === "3") {
      return 2 * (width) / 5
    } else if (d.group === "4") {
      return 1 * (width) / 5
    } else {
      return 0 * (width) / 5
    }
  }).strength(1))
  .force("y", d3.forceY(height / 2))
  // .force("center", d3.forceCenter((width) / 2, height / 2))
  .force("collision", d3.forceCollide().radius(35));

// ######################################
// # Read graph.json and draw SVG graph #
// ######################################


  // d3.selectAll("svg > *").remove();
  var oig_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var orig_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;


  link_color = "black";
  link_hover_color = "green";
  // var remote = require('electron').remote;
  // graph = JSON.parse(remote.getGlobal('sharedObj'));


  for (var i = 0; i < graph.links.length; i++) {
    graph.links[i].linknum = 1;
    for (var j = 0; j < i; j++) {
      if ((graph.links[i].source == graph.links[j].source && graph.links[i].target == graph.links[j].target)
        ||
        (graph.links[i].source == graph.links[j].target && graph.links[i].target == graph.links[j].source)) {
        graph.links[i].linknum += 0.5;
      }
    }
  };

  var link = svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .enter().append("svg:path")
    .attr("fill", "none")
    .attr("stroke", link_color)
    .attr("stroke-width", function (d) { return Math.sqrt(parseInt(1)); })
    .attr("src", function (d) { return d.source; })
    .attr("trg", function (d) { return d.target; })
    .attr("dev", function (d) { return d.device; })




  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("a")
    .data(graph.nodes)
    .enter().append("a")
    .attr("target", '_blank')
    .attr("xlink:href", function (d) { return (window.location.href + '?device=' + d.id) });


  node.on("click", function (d, i) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    OnClickDetails(d.id);
  }
  );

  node.call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

  node.append("image")
    .attr("xlink:href", function (d) {
      switch (d.group) {
        case "0":
          return "img/controller.svg";
        default:
          return ("img/group" + d.group + ".svg");
      }
    })
    .attr("width",  function (d) {
      switch (d.group) {
        case "3": // make the internet logo bigger than others
          return 100;
        default:
          return 50;
      }
    })
    .attr("height",  function (d) {
      switch (d.group) {
        case "3": // make the internet logo bigger than others
          return 100;
        default:
          return 50;
      }
    })
    .attr("x", - 16)
    .attr("y", - 16)
    .attr("fill", function (d) { return color(d.group); });

  node.append("text")
    .attr("font-size", "0.8em")
    .attr("dx", 5)
    // .attr("dy", ".35em")
    .attr("dy", -25)
    .attr("x", +8)
    .text(function (d) { return d.id });

  node.append("title")
    .text(function (d) { return d.id; });

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);

  function ticked() {
    link
        .attr("d", linkArc);
    node
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" });
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = oig_width / d.linknum;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }


  simulation.alphaTarget(0.3).restart();

  node.on("mouseover", function (d) {
    var current_node_links = d.links;
    var current_device = d.id
    d3.selectAll('path').each(function (d, i) {
      for (var ll = 0; ll < current_node_links.length; ll++) {
        if (d3.select(this).attr("src") == current_node_links[ll]["source"] &&
          d3.select(this).attr("trg") == current_node_links[ll]["target"] &&
          d3.select(this).attr("dev") == current_device
        ) {
          d3.select(this)
            .style("stroke", link_hover_color)
            .style("stroke-width", 2);


          totalLength = 10;
          d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength / 2)
            .attr("stroke-dashoffset", totalLength * 30)
            .transition()
            .duration(20000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
        }
      }
    }
    )
  });
  node.on("mouseout", function (d) {
    var current_node_links = d.links;
    d3.selectAll('path').each(function (d, i) {
      for (var ll = 0; ll < current_node_links.length; ll++) {
        if (d3.select(this).attr("src") == current_node_links[ll]["source"] && d3.select(this).attr("trg") == current_node_links[ll]["target"]) {
          d3.select(this)
            .style("stroke", link_color)
            .style("stroke-width", 1);
          totalLength = 0;
          d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength);
          d3.select(this).transition();
        }
      }
    }
    )
    // d3.selectAll('g.link').each(function(){d3.select(this).style("stroke","pink");});
  });


  link.on("mouseover", function () { d3.select(this).style("stroke", link_hover_color); });
  link.on("mouseout", function () { d3.select(this).style("stroke", link_color) });




  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    // d.fx = null;
    // d.fy = null;
    d.fx = d3.event.x;
    d.fy = d3.event.y;

  }
}

var network;
var network_data;
require('electron').ipcRenderer.on('draw', (event, message) => {
  var remote = require('electron').remote;
network = new Mud_Network(JSON.parse(remote.getGlobal('sharedObj')));
  network.create_network()


  var interval = setInterval(function () {
    // get elem
    if (network.ready_to_draw == false) {
      return;
    }
    clearInterval(interval);

     network_data = network.get_nodes_links_json();
    mud_drawer(network_data);

  }, 100);

})


function drawer(){
  d3.selectAll("svg > *").remove();
  // var remote = require('electron').remote;
  // network = new Mud_Network(JSON.parse(remote.getGlobal('sharedObj')));
  // network.create_network()
  mud_drawer(network_data);

  // var interval = setInterval(function () {
  //   // get elem
  //   if (network.ready_to_draw == false) {
  //     return;
  //   }
  //   clearInterval(interval);

  //   network_data = network.get_nodes_links_json();
  //   mud_drawer(network_data);

  // }, 100);

}


require('electron').ipcRenderer.on('resize', (event, message) => {

  width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  d3.select("svg").attr("height", height)
  d3.select("svg").attr("width", width)
  // to redraw : 
  // d3.selectAll("svg > *").remove();
  // mud_drawer();
})


require('electron').ipcRenderer.on('clearsvg', (event, message) => {
  d3.selectAll("svg > *").remove();
});


var mudfile_select_menu_open = false;

$("#SelectMudFiles").click(function () {
  if (mudfile_select_menu_open == false) {
    $("#welcomeDiv").fadeIn("slow", function () {
      mudfile_select_menu_open = true;
    });
  }
});

$(":not(#welcomeDiv)").click(function () {
  if (mudfile_select_menu_open == true) {
    $("#welcomeDiv").fadeOut("slow", function () {
      mudfile_select_menu_open = false;
    });
  }
});