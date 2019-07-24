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
  
const uuidv4 = require('uuid/v4');


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
    if (d.group === "1") {
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

function mud_drawer (graph){
  d3.selectAll("svg > *").remove();
  var oig_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var orig_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;


  link_color = "black";
  link_hover_color = "green";
  // var remote = require('electron').remote;
  // graph = JSON.parse(remote.getGlobal('sharedObj'));
  

  for (var i=0; i<graph.links.length; i++) {
    graph.links[i].linknum = 1;
    for (var j=0; j<i; j++){
      if ((graph.links[i].source == graph.links[j].source && graph.links[i].target == graph.links[j].target) 
          ||
          (graph.links[i].source == graph.links[j].target && graph.links[i].target == graph.links[j].source)) 
         {
          graph.links[i].linknum  += 0.5;
         }
      }
    };

    var link = svg.append("g")
      .selectAll("path")
      .data(graph.links)
      .enter().append("svg:path")
      .attr("fill","none")
      .attr("stroke",link_color)
      .attr("stroke-width", function (d) { return Math.sqrt(parseInt(1)); })
      .attr("src",function(d){ return d.source;})
      .attr("trg",function(d){return d.target;})
      .attr("dev",function(d){return d.device;})
    
      


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
      // .attr("dy", ".35em")
      .attr("dy", 12)
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

      // link.attr("d", function(d) {
      //   var dx = d.target.x - d.source.x,
      //       dy = d.target.y - d.source.y,
      //       dr = 400/d.linknum;  //linknum is defined above
      //   return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;});
      
      link.attr("d", linkArc);

      node
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" });
    }
    
    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = oig_width/d.linknum;
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }


    simulation.alphaTarget(0.3).restart();
    
    node.on("mouseover",function(d){ 
      var current_node_links = d.links ; 
      var current_device = d.id 
      d3.selectAll('path').each(function(d,i){
        for (var ll = 0; ll < current_node_links.length ; ll ++ ){
          if (d3.select(this).attr("src") == current_node_links[ll]["source"] && 
              d3.select(this).attr("trg") == current_node_links[ll]["target"] && 
              d3.select(this).attr("dev") == current_device 
              ){
              d3.select(this)
                .style("stroke",link_hover_color)
                .style("stroke-width", 2);

            
              totalLength = 10;
              d3.select(this)
              .attr("stroke-dasharray", totalLength + " " + totalLength/2)
              .attr("stroke-dashoffset", totalLength*30)
              .transition()
                .duration(8000)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
            }
          }
        }
      )
    });
    node.on("mouseout",function(d){ 
      var current_node_links = d.links ; 
      d3.selectAll('path').each(function(d,i){ 
        for (var ll = 0; ll < current_node_links.length ; ll ++ ){
          if (d3.select(this).attr("src") == current_node_links[ll]["source"] && d3.select(this).attr("trg") == current_node_links[ll]["target"] ){
            d3.select(this)
              .style("stroke",link_color)
              .style("stroke-width", 1);
            totalLength = 0; 
            d3.select(this)
              .attr("stroke-dasharray", totalLength + " " + totalLength)
              .attr("stroke-dashoffset", totalLength);
            }
          }    
        }
        )
      // d3.selectAll('g.link').each(function(){d3.select(this).style("stroke","pink");});
    });


    link.on("mouseover", function(){ d3.select(this).style("stroke",link_hover_color);} );
    link.on("mouseout", function(){ d3.select(this).style("stroke",link_color)});
  



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

///////////////////////////////////
//////////////// MUD NETWORK 
//////////////////////////////////

class Mud_Network {
  constructor(multi_mud_json){
      this.multi_mud_json = multi_mud_json;
      this.allNodes = [];
      this.allLinks = [];
      this.abstractions = [];
      this.Mud_list = [];
      this.allAbstractions = [];
      this.muds_with_controller = 0;  // this includes my-controllers too 
      this.controllers = [] ; 
      this.my_controllers = [] ; 
      this.mud_with_promises = [];
      this.all_modelnames = find_values_by_key(multi_mud_json,"model-name");
      this.non_unique_modelnames = this.get_non_unique_modelnames();
      this.allNodes.push({"group":"2","id":"Router","abstractions":[]});
      this.allNodes.push({"group":"3","id":"Internet","abstractions":[]});
  }

  get_non_unique_modelnames(){
      var sorted_models = this.all_modelnames.slice().sort();
      var non_unique_models = [];
  
      for (var i = 0; i < sorted_models.length - 1; i++) {
          if (sorted_models[i + 1] == sorted_models[i]) {
              non_unique_models.push([sorted_models[i],1]);
          }
      }
      return non_unique_models;
  }

  
  get_nodes_links_json(){
      return {"nodes": this.allNodes, "links": this.allLinks};
  }

  updat_localnetworks_links(){
      for (var mud_idx = 0 ; mud_idx < this.Mud_list.length ; mud_idx ++ ){
          var current_mud = this.Mud_list[mud_idx];
          if (current_mud.abstractions.includes("local-networks")){
              for (var n_idx = 0 ; n_idx < this.allNodes.length ; n_idx++ ){
                  if (current_mud.index_in_allnodes != n_idx && this.allNodes[n_idx].group == '1') {
                      this.allLinks.push({"source": "Router","target":this.allNodes[n_idx].id, "value": "10", "device":current_mud.model});
                      current_mud.link_of_current_node.push({"source": "Router", "target":this.allNodes[n_idx].id,"value": "10", "device":current_mud.model});        
                  }
              }
          }
      }
  }

  update_samemanufacturer_links(){
      for (var mud_idx = 0 ; mud_idx < this.Mud_list.length ; mud_idx ++ ){
          var current_mud = this.Mud_list[mud_idx];
          if (current_mud.abstractions.includes("same-manufacturer")){
              for (var n_idx = 0 ; n_idx < this.allNodes.length ; n_idx++ ){
                  if (current_mud.index_in_allnodes != n_idx && 
                      this.allNodes[n_idx].group == '1' &&
                      current_mud.manufacturer == this.allNodes[n_idx].manufacturer) {
                          this.allLinks.push({"source": "Router","target":this.allNodes[n_idx].id, "value": "10", "device":current_mud.model});
                          current_mud.link_of_current_node.push({"source": "Router", "target":this.allNodes[n_idx].id,"value": "10", "device":current_mud.model});        
                  }
              }
          }
      }
  }

  update_manufacturer_links(){
      for (var mud_idx = 0 ; mud_idx < this.Mud_list.length ; mud_idx ++ ){
          var current_mud = this.Mud_list[mud_idx];
          if (current_mud.abstractions.includes("manufacturer")){
              for (var n_idx = 0 ; n_idx < this.allNodes.length ; n_idx++ ){
                  if (current_mud.index_in_allnodes != n_idx && 
                      this.allNodes[n_idx].group == '1' &&
                      current_mud.other_manufacturer.includes(this.allNodes[n_idx].manufacturer)) {
                          this.allLinks.push({"source": "Router","target":this.allNodes[n_idx].id, "value": "10", "device":current_mud.model});
                          current_mud.link_of_current_node.push({"source": "Router", "target":this.allNodes[n_idx].id,"value": "10", "device":current_mud.model});        
                  }
              }
          }
      }
  }

  has_promise(){
    if (this.mud_with_promises.length > 0){
      return true; 
    }
    return false; 
  }

  process_promises(){
    // for (var mud_idx=0; mud_idx < this.mud_with_promises.length; mud_idx ++){
      var tmp_mud = this.mud_with_promises[0];
      var style = 
      '<style>  \
          dynamic {color: brown; \
                  font-weight: bold} \
          input {  \
                    width: 80%;} \
      </style>'
      var egress_html =  style + 
          // '<div style="border: 1px solid #000000;">' +     
          '<p style="border: 1px;"> The device <dynamic>' + tmp_mud.model + 
          '</dynamic> in this network needs its controller to be configured for <dynamic>egress</dynamic> traffic:</p>' + 
          '<div style="border: 1px solid #000000;">' ;

      var ingress_html = style +       
          // '<div style="border: 1px solid #000000;">' +     
          '<p style="border: 1px;"> The device <dynamic>' + tmp_mud.model + 
          '</dynamic> in this network needs its controller to be configured for <dynamic>ingress</dynamic> traffic:</p>' ;
          

      var ace_types = unique(find_values_by_key(tmp_mud.promise,'type'));
      for (var type_idx = 0 ; type_idx < ace_types.length ; type_idx++){
        egress_html += '<div style="border: 1px solid #000000; padding-top: 5px; padding-bottom: 10px;"> ACL Type: <dynamic>' + ace_types[type_idx] + '</dynamic><div>' ;
        var current_ace_type = ace_types[type_idx];
        for (var promise_idx = 0 ; promise_idx < tmp_mud.promise.length(); promise_idx++){

          // html_content =   '<p> The device <span style="color: brown;font-weight: bold">' + my_controller.model + 
          // '</span> in this network needs its controller to be configured:</p> ';
          // for 

          // 'Controller Name: <input id="swal-input1" class="swal2-input">' +
          // 'Controller IP Address: <input id="swal-input2" class="swal2-input">',

          // Swal.fire({
          //             title: 'Configure My-Controller',
          //             html:
          //             '<div style="border: 1px;">' +   
          //             '<p style="border: 1px;"> The device <span style="color: brown;font-weight: bold">' + tmp_mud.model + 
          //               '</span> in this network needs its controller to be configured:</p> ' +
          //               '</div>'+ 
          //               'Controller Name: <input id="swal-input1" class="swal2-input">' +
          //               'Controller IP Address: <input id="swal-input2" class="swal2-input">' +
          //               '<div>' + 
          //               'Controller Name: <input id="swal-input1" class="swal2-input">' +
          //               'Controller IP Address: <input id="swal-input2" class="swal2-input">' + 
          //               '</div>',
          //             focusConfirm: false,
          //             preConfirm: () => {
          //               return [
          //                 document.getElementById('swal-input1').value,
          //                 document.getElementById('swal-input2').value
          //               ]
          //             }
          //           })
          // const Swal = require('sweetalert2');
          
          var tmp_promise = tmp_mud.promise.data[promise_idx];
          if (tmp_promise.ace.type == current_ace_type){
            for (var key_idx = 0 ; key_idx < tmp_promise.keys.length ; key_idx++) {
              egress_html += tmp_promise.keys[key_idx] + ': <br><input id="' + tmp_promise.input_id[key_idx] +'" align="right"><br>';
            }
          }      
        }
        egress_html += '</div></div>' ;
      }
      egress_html  += '</div>';
      ingress_html  += '</div>';
      Swal.fire({
        title:"Configuring My-Controller", 
        html: egress_html, 
        allowOutsideClick: false
        // preConfirm: () => {return document.getElementById('swal-input1').value;}
        }).then(()=>{
          for (var dat_idx = 0 ; dat_idx < tmp_mud.promise.data.length; dat_idx ++){
            for (var key_idx = 0 ; key_idx < tmp_mud.promise.data[dat_idx].keys.length; key_idx ++){
              let tmp_input_id = tmp_mud.promise.data[dat_idx].input_id[key_idx];
              let tmp_input_value = document.getElementById(tmp_input_id).value;
              console.log(tmp_input_value);
              tmp_mud.promise.data[dat_idx].values = tmp_mud.promise.data[dat_idx].values.concat(tmp_input_value);
            }
          }
          this.mud_with_promises.shift();
          this.process_promises();
        });
      // if (formValues) {
      //   Swal.fire(JSON.stringify(formValues));
      // }
    // }
  }

  create_network(){
      
      for (var current_mud_name in  this.multi_mud_json){
          var current_mud = new Mud(this.multi_mud_json[current_mud_name], this.non_unique_modelnames, this.allNodes, this.allLinks, this.allAbstractions, this.promise);
          if (current_mud.has_promise()){
            this.mud_with_promises = this.mud_with_promises.concat(current_mud);
          }    
          this.Mud_list = this.Mud_list.concat(current_mud)
      }
      this.updat_localnetworks_links(); 
      this.update_samemanufacturer_links();
      this.update_manufacturer_links();
      this.process_promises();
  }
}


///////////////////////////////////////
//////////////// promise
///////////////////////////////////////

class Mud_Promise {
  constructor(uuid,model){
    this.uuid = uuid; 
    this.model = model;
    this.data = [];
  }

  isempty(){
    if (this.data.length == 0){
      return true;
    }
    return false; 
  }

  append(promise_data){
    promise_data.input_id = [] 
    for (var dat_idx = 0 ; dat_idx < promise_data.keys.length ; dat_idx ++){
      promise_data.input_id = promise_data.input_id.concat(uuidv4());
    }
    this.data = this.data.concat(promise_data);
  }

  length(){
    return this.data.length;
  }
}

///////////////////////////////////
//////////////// MUD Node
//////////////////////////////////

class Mud {
  constructor(mudfile,non_unique_modelnames, allNodes, allLinks, allAbstractions) {
      this.mudfile = mudfile; 
      this.model = find_values_by_key(this.mudfile,"model-name")[0];
      for (var z = 0 ; z < non_unique_modelnames.length; z++ ){
          if (non_unique_modelnames[z][0] == this.model){
              this.model = this.model + non_unique_modelnames[z][1]; 
              non_unique_modelnames[z][1] += 1; 
              break;
          }          
      }
      this.uuid = uuidv4();
      this.promise = new Mud_Promise(this.uuid, this.model);
      this.FromDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile,"from-device-policy")[0], "name");
      this.ToDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile,"to-device-policy")[0], "name");   
      this.acls = this.extract_acls();
      this.allAbstractions = allAbstractions;
      this.abstractions = []
      this.FromDevicePolicies = [];
      this.FromDeviceAces = [];
      this.FromDeviceControllers = [] ; 
      this.ToDevicePolicies = [];
      this.ToDeviceAces = [];
      this.ToDeviceControllers = [] ; 
      this.allNodes = allNodes; 
      this.allLinks = allLinks; 
      this.link_of_current_node = [];
      this.index_in_allnodes = -1;
      this.manufacturer = this.extract_manufacturer()
      this.other_manufacturer = this.extract_others_manufacturer();
      this.extract_device_policies();
      this.extract_FromDevice_links();
  }

  has_promise(){
    if (this.promise.isempty()){
      return false; 
    }
    return true; 
  }

  extract_acls() {
      this.ietf_acl = find_values_by_key(this.mudfile,"ietf-access-control-list", true);
      return find_values_by_key(this.ietf_acl,'acl')[0];
  }
  extract_device_policies() {
      for (var acl_idx = 0 ; acl_idx < this.acls.length ; acl_idx++){
          var current_acl = this.acls[acl_idx];
          if (this.is_FromDevicePolicy(current_acl)){
              this.FromDevicePolicies = this.FromDevicePolicies.concat(current_acl);
              for (var ace in current_acl['aces']){
                  var current_aces = current_acl['aces'][ace];
                  // adding the "ace type" to the aces 
                  for (var ace_idx = 0 ; ace_idx < current_aces.length ; ace_idx ++ ){
                    current_aces[ace_idx].type = current_acl.type;
                  }
                  this.FromDeviceAces = this.FromDeviceAces.concat(current_aces);
              }
          }
          else if (this.is_ToDevicePolicy(current_acl)){
              this.ToDevicePolicies = this.ToDevicePolicies.concat(current_acl);
              for (var ace in current_acl['aces']){
                  var current_aces = current_acl['aces'][ace];
                  // adding the "ace type" to the aces 
                  for (var ace_idx = 0 ; ace_idx < current_aces.length ; ace_idx ++ ){
                    current_aces[ace_idx].type = current_acl.type;
                  }
                  this.ToDeviceAces = this.ToDeviceAces.concat(current_aces);
              }
          }
      }        
  }

  is_FromDevicePolicy(acl){
      var acl_name = find_values_by_key(acl,'name'); 
      for (var ii = 0; ii < this.FromDevicePolicies_names.length; ii++) {
          if (acl_name.indexOf(this.FromDevicePolicies_names[ii]) > -1) {
              return true; 
          }
      }
      return false; 
  }

  is_ToDevicePolicy(acl){
      var acl_name = find_values_by_key(acl,'name'); 
      for (var ii = 0; ii < this.ToDevicePolicies_names.length; ii++) {
          if (acl_name.indexOf(this.ToDevicePolicies_names[ii]) > -1) {
              return true; 
          }
      }
      return false; 
  }
  
  extract_FromDevice_links() {
      for (var acl_idx = 0 ; acl_idx < this.FromDeviceAces.length ; acl_idx++){
          var ace = this.FromDeviceAces[acl_idx];
          var abstract = this.get_abstract_types(ace);
          // add the abstraction to this mud instance if it's not there yet: 
          if (!this.abstractions.includes(abstract)){
            this.abstractions = this.abstractions.concat(abstract);
          }
          if (!this.allAbstractions.includes(abstract)){
            this.allAbstractions = this.allAbstractions.concat(abstract);
          }

          var abstract_matched = true;
          switch(abstract){
              case "domain-names":
                  var destination = find_values_by_key(ace,"ietf-acldns:dst-dnsname")[0];
                  if (!this.allNodes_includes(destination)) {
                      this.allNodes.push({"group":String(4),"id":destination, "abstractions":["domain-names"]});
                  }
                      
                  this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                  this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});

                  this.allLinks.push({"source": "Internet","target":destination,"value": "10", "device":this.model});  
                  this.link_of_current_node.push({"source": "Internet","target":destination,"value": "10", "device":this.model});

                  this.allLinks.push({"source": "Router","target":"Internet","value": "10", "device":this.model})
                  this.link_of_current_node.push({"source": "Router","target":"Internet","value": "10", "device":this.model})

                  break;
              case "local-networks":
              case "same-manufacturer":
              case "manufacturer":
                  if (!this.is_connected_to_Router()){
                      this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                      this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                  }
                  break;
              case "my-controller":
                  this.promise.append({'direction': 'egress', 'ace': ace,  'abstraction': 'my-controller' ,'keys': ['Name', 'IP Address'],'values':[]});
                  // const {value: formValues} = Swal.fire({
                  //   title: 'Configure My-Controller',
                  //   html:
                  //     '<p> The device <span style="color: brown;font-weight: bold">' + my_controller.model + '</span> in this network needs its controller to be configured:</p> ' + 
                  //     'Controller Name: <input id="swal-input1" class="swal2-input">' +
                  //     'Controller IP Address: <input id="swal-input2" class="swal2-input">',
                  //   focusConfirm: false,
                  //   preConfirm: () => {
                  //     return [
                  //       document.getElementById('swal-input1').value,
                  //       document.getElementById('swal-input2').value
                  //     ]
                  //   }
                  // })

                  // if (formValues) {
                  //   this.allNodes.push({"group":String(1),"id": document.getElementById('swal-input1').value, "abstractions":["my-controller"]});
                  //   Swal.fire(JSON.stringify(formValues))
                  // }
                  
                  if (!this.is_connected_to_Router()){
                      this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                      this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                  }
                  break;
              default: 
                  abstract_matched = false; 
          }
          if (abstract_matched && !this.node_is_in_allNodes()){
              this.index_in_allnodes = this.allNodes.length; 
              this.allNodes.push({"group":String(1), "id":this.model, "abstractions":this.abstractions ,"links":this.link_of_current_node, "manufacturer": this.manufacturer});
          }   
      }
  }
 
  extract_manufacturer(){
      var mud_url = find_values_by_key(this.mudfile,'mud-url')[0];
      let psl = require('psl');
      return psl.get(this.extractHostname(mud_url)); 
  }

  extract_others_manufacturer(){
      return this.get_unique_values(find_values_by_key(this.mudfile,"manufacturer"));
  }

  get_unique_values(inp_list){
      return [... new Set(inp_list)];
  }

  extractHostname(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname
  
      if (url.indexOf("//") > -1) {
          hostname = url.split('/')[2];
      }
      else {
          hostname = url.split('/')[0];
      }
  
      //find & remove port number
      hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];
  
      return hostname;
  }

  node_is_in_allNodes(){
      return (this.index_in_allnodes != -1)
  }

  allNodes_includes(node){
      return (find_values_by_key(Object.values(this.allNodes),'id').indexOf(node) != -1)
  }

  is_connected_to_Router(){
      return (find_values_by_key(Object.values(this.allLinks),'source').indexOf(this.model) != -1)
  }

  get_abstract_types(ace){
      var abstract_types = []; 
      var mud_acls = find_values_by_key(ace,"ietf-mud", true)
      if (mud_acls.length == 0){
          abstract_types = abstract_types.concat("domain-names");
      }
      else{ 
          for (var j = 0 ; j < mud_acls.length ; j++){
              var current_abstract = Object.keys(mud_acls[j])[0];
              if (!abstract_types.includes(current_abstract)){
                  abstract_types = abstract_types.concat(Object.keys(mud_acls[j]))
              }
          }
      }
      if (abstract_types.length > 1){
          console.warn("more than one absraction found in a ace");
      }
      return abstract_types[0]; 
  }
}

function find_values_by_key(json_data, target_key, partial = false) {
  output = []
  for (var key_ in json_data) {
      if (partial === false ){
          if (key_ == target_key){
              output = output.concat([json_data[key_]]);
          }
          else if (typeof (json_data[key_]) == 'object') {
              output = output.concat(find_values_by_key(json_data[key_], target_key, partial=false));
          }
      }
      else if (partial === true ) {
          if (key_.includes(target_key)){
              output = output.concat([json_data[key_]]);
            }
          else if (typeof (json_data[key_]) == 'object') {
              output = output.concat(find_values_by_key(json_data[key_], target_key, partial=true));
          }
      }
  }
  return output; 
} 

function unique(inp_list){
  return [... new Set(inp_list)];
}

require('electron').ipcRenderer.on('draw', (event, message) => {
  var remote = require('electron').remote;
  network = new Mud_Network(JSON.parse(remote.getGlobal('sharedObj')));
  network.create_network()


  var interval = setInterval(function() {
    // get elem
    if (network.has_promise()) {
      return;
    }
    clearInterval(interval);
    
    network_data = network.get_nodes_links_json();
    mud_drawer(network_data);
  
  }, 2000);  
  
})

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

const Swal = require('sweetalert2');

require('electron').ipcRenderer.on('my-controller-prompt', (event, my_controller) => {
  const {value: formValues} = Swal.fire({
    title: 'Configure My-Controller',
    html:
      '<p> The device <span style="color: brown;font-weight: bold">' + my_controller.model + '</span> in this network needs its controller to be configured:</p> ' + 
      'Controller Name: <input id="swal-input1" class="swal2-input">' +
      'Controller IP Address: <input id="swal-input2" class="swal2-input">',
    focusConfirm: false,
    preConfirm: () => {
      return [
        document.getElementById('swal-input1').value,
        document.getElementById('swal-input2').value
      ]
    }
  })
  
  if (formValues) {
    Swal.fire(JSON.stringify(formValues))
  }

  var inp1 = document.getElementById('swal-input1').value;
  const { BrowserWindow } = require('electron').remote
});

