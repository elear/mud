// =============================
// PRINTING DEVICE DETAILS TABLE
// =============================

// ====================
// READING OF JSON FILE 
// ====================
function readTextFile(file, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4 && rawFile.status == "200") {
      callback(rawFile.responseText);
    }
  }
  rawFile.send(null);
}

function OnClickDetails(deviceid) {
  //alert("devicedetails: " + deviceid);
  //usage:

  // #############################
  // # READING NEIGHBORS         #
  // #############################  
  readTextFile("python/neighborships.json", function (text) {
    var data = JSON.parse(text);
    console.log(data);
    console.log(deviceid);

    bFoundMatch = 0;
    for (var key in data) {
      console.log("Key: " + key + " vs " + deviceid);

      if ((deviceid.localeCompare(key)) == 0) {
        console.log("match!");
        bFoundMatch = 1;
        text = tableFromNeighbor(key, data);

        printToDivWithID("infobox", "<h2><u>" + key + "</u></h2>" + text);
      }
    }
    if (!(bFoundMatch)) {
      warning_text = "<h4>The selected device id: ";
      warning_text += deviceid;
      warning_text += " is not in database!</h4>";
      warning_text += "This is most probably as you clicked on edge node ";
      warning_text += "that is not NETCONF data gathered, try clicking on its neighbors.";
      printToDivWithID("infobox", warning_text);
    }
  });

  // ####################################
  // # READING NEIGHBOR-LESS INTERFACES #
  // ####################################
  readTextFile("python/no_neighbor_interfaces.json", function (text) {
    var data = JSON.parse(text);
    console.log(data);
    console.log(deviceid);

    bFoundMatch = 0;
    for (var key in data) {
      console.log("Key: " + key + " vs " + deviceid);

      if ((deviceid.localeCompare(key)) == 0) {
        console.log("match!");
        bFoundMatch = 1;
        text = tableFromUnusedInterfaces(key, data);
        printToDivWithID("infobox2", "<font color=\"red\">Enabled Interfaces without LLDP Neighbor:</font><br>" + text);
      }
    }
    if (!(bFoundMatch)) {
      printToDivWithID("infobox2", "");
    }
  });
}

// ####################################
// # using input parameters returns 
// # HTML table with these inputs
// ####################################
function tableFromUnusedInterfaces(key, data) {
  text = "<table class=\"infobox2\">";
  text += "<thead><th><u><h4>LOCAL INT.</h4></u></th><th><u><h4>DESCRIPTION</h4></u></th><th><u><h4>Bandwith</h4></u></th>";
  text += "</thead>";

  for (var neighbor in data[key]) {
    text += "<tr>";

    console.log("local_intf:" + data[key][neighbor]['local_intf']);
    text += "<td>" + data[key][neighbor]['local_intf'] + "</td>";
    console.log("description:" + data[key][neighbor]['description']);
    text += "<td>" + data[key][neighbor]['description'] + "</td>";
    console.log("actual_bandwith:" + data[key][neighbor]['actual_bandwith']);
    text += "<td>" + data[key][neighbor]['actual_bandwith'] + "</td>";

    text += "</tr>";
  }

  text += "</table>";

  return text;
}

// ####################################
// # using input parameters returns 
// # HTML table with these inputs
// ####################################
function tableFromNeighbor(key, data) {
  text = "<table class=\"infobox\">";
  text += "<thead><th><u><h4>LOCAL INT.</h4></u></th><th><u><h4>NEIGHBOR</h4></u></th><th><u><h4>NEIGHBOR'S INT</h4></u></th>";
  text += "</thead>";

  for (var neighbor in data[key]) {
    text += "<tr>";

    console.log("local_intf:" + data[key][neighbor]['local_intf']);
    text += "<td>" + data[key][neighbor]['local_intf'] + "</td>";
    console.log("neighbor_intf:" + data[key][neighbor]['neighbor_intf']);
    text += "<td>" + data[key][neighbor]['neighbor'] + "</td>";
    console.log("neighbor:" + data[key][neighbor]['neighbor']);
    text += "<td>" + data[key][neighbor]['neighbor_intf'] + "</td>";

    text += "</tr>";
  }

  text += "</table>";

  return text;
}

// ####################################
// # replaces content of specified DIV
// ####################################
function printToDivWithID(id, text) {
  div = document.getElementById(id);
  div.innerHTML = text;
}

// ########
// # MAIN #
// ########
var svg = d3.select("svg"),
  //width = +svg.attr("width"),
  //height = +svg.attr("height");
  width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
  height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

d3.select("svg").attr("height", height)
d3.select("svg").attr("width", width * 0.7)

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function (d) { return d.id; }).distance(100).strength(0.001))
  .force("charge", d3.forceManyBody().strength(-200).distanceMax(500).distanceMin(50))
  .force("x", d3.forceX(function (d) {
    if (d.group === "1") {
      return 3 * (width * 0.7) / 4
    } else if (d.group === "2") {
      return 2 * (width * 0.7) / 4
    } else if (d.group === "3") {
      return 1 * (width * 0.7) / 4
    } else {
      return 0 * (width * 0.7) / 4
    }
  }).strength(1))
  .force("y", d3.forceY(height / 2))
  .force("center", d3.forceCenter((width * 0.7) / 2, height / 2))
  .force("collision", d3.forceCollide().radius(35));

// ######################################
// # Read graph.json and draw SVG graph #
// ######################################
d3.json("test.json", function (error, graph) {
  if (error) throw error;
  // q = mud_to_nodes(graph);
  // model_names = find_values_by_key(graph, "model-name");
  // from_device = find_values_by_key(graph, "from-device-policy");
  // [nodes, links] = mud_to_nodes (graph);  
  // fs.writeFile('./tester.json', JSON.stringify({"nodes": nodes,"links":links}) , 'utf-8');
  // graph.nodes = nodes
  // graph.links = links  
  var link = svg.append("g")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .attr("stroke", function (d) { return color(parseInt(d.value)); })
    .attr("stroke-width", function (d) { return Math.sqrt(parseInt(d.value)); });

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
    .attr("xlink:href", function (d) { return ("img/group" + d.group + ".png"); })
    .attr("width", 32)
    .attr("height", 32)
    .attr("x", - 16)
    .attr("y", - 16)
    .attr("fill", function (d) { return color(d.group); });

  node.append("text")
    .attr("font-size", "0.8em")
    .attr("dx", 12)
    .attr("dy", ".35em")
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
      .attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; });

    node
      .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" });
  }
});

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
  d.fx = null;
  d.fy = null;
}

function find_values_by_key(json_data, target_key) {
  output = []
  for (var key_ in json_data) {
    if (key_ == target_key){
      // console.log(json_data[key_]);
      output = output.concat([json_data[key_]]);
    }
    else if (typeof (json_data[key_]) == 'object') {
      output = output.concat(find_values_by_key(json_data[key_], target_key));
    }
  }
  return output; 
}

function mud_to_nodes(multi_mud_json){
  nodes = []
  links = []
  modelnames = find_values_by_key(multi_mud_json,"model-name");
  unique_modelnames = [... new Set(modelnames)];
  group_counter = new Array(unique_modelnames.length).fill(1)
  
  nodes.push({"group":"2","id":"Router"})

  for (var current_mud_name in  multi_mud_json){
    var current_mud = multi_mud_json[current_mud_name];
    for (var m = 0 ; m < unique_modelnames.length ; m ++){
      model = unique_modelnames[m];
      if (find_values_by_key(current_mud,'model-name') == model){
        nodes.push({"group":String(m+1),"id":model+group_counter[m]})
        group_counter[m] += 1; 
      }       
    }
    var from_device_policies = find_values_by_key(find_values_by_key(current_mud,"from-device-policy"), "name");
    var to_device_policies = find_values_by_key(find_values_by_key(current_mud,"to-device-policy"), "name");

    
    var all_acl_lists = find_values_by_key(current_mud,"ietf-access-control-list:acls");
    var acls = []
    for (var acl_idx=0; acl_idx < all_acl_lists.length ; acl_idx++){
      acls = acls.concat(find_values_by_key(all_acl_lists[acl_idx],'acl')[0]);
    }
    for (var acl_i = 0 ; acl_i < acls.length ; acl_i++){
      // check if the name of that ACL exists in the acl rule 
      var acl_found = false;
      for (var ii = 0; ii < from_device_policies.length; ii++) {
          tmp_acl_names = find_values_by_key( acls[acl_i],'name'); 
          if (tmp_acl_names.indexOf(from_device_policies[ii]) > -1) {
              acl_found = true;
              break;
          }
      }


      if (acl_found == true) {
          target =  find_values_by_key(acls[acl_idx],"ietf-acldns:dst-dnsname") [0]; 
          // check if node is already added
          if (find_values_by_key(Object.values(nodes),'id').indexOf(target) == -1) {
            nodes.push({"group":String(3),"id":target})
          }
          // check if link is already added 
          if (find_values_by_key(Object.values(links),'source').indexOf(model) == -1 || find_values_by_key(Object.values(links),'target').indexOf(target) == -1) {
            links.push({"source": model,"target":"Router","value": "40"})  
            links.push({"source": "Router","target":target,"value": "40"})  
          }

      }

    }

  }

  return [nodes,links];
}


function countItems(arr, what){
  var count= 0, i;
  while((i= arr.indexOf(what, i))!= -1){
      ++count;
      ++i;
  }
  return count
}
