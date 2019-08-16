// This file contains the main two class for building the network of mud nodes: MUD_Network and MUD


const uuidv4 = require('uuid/v4');
const Swal = require('sweetalert2');
var incoming = "incoming";
var outgoing = "outgoing";


var allNodesObj = new AllNodes();
var allLinksObj = new AllLinks();
var router_node = new Node("2", "Router");
var internet_node = new Node("3", "Internet");
allNodesObj.add_node_if_not_exists(router_node);
allNodesObj.add_node_if_not_exists(internet_node);
/////////////////////////////////////////////
//////////////// MUD NETWORK ////////////////
/////////////////////////////////////////////

class Mud_Network {
    constructor() {
        this.ready_to_draw = false;
        this.all_mud_jsons = [];
        this.mud_with_promises_raw = [];
        this.mud_with_promises_processed = [];
        this.all_modelnames = [];
        this.non_unique_modelnames = [];
        this.tmp_dev;
    }

    add_mudfile(mud_json) { // used in rendere process
        this.all_mud_jsons = this.all_mud_jsons.concat({ 'data': mud_json, 'visible': true, 'processed': false });
        let model_name = find_model_name(mud_json);
        this.all_modelnames = this.all_modelnames.concat(model_name);
        this.update_non_unique_modelnames();
    }

    update_non_unique_modelnames() {
        var sorted_models = this.all_modelnames.slice().sort();

        for (var i = 0; i < sorted_models.length - 1; i++) {
            if (sorted_models[i + 1] == sorted_models[i]) {
                let model_exists = false;
                for (var tmp_mod in this.non_unique_modelnames) {
                    if (this.non_unique_modelnames[tmp_mod][0] == sorted_models[i]) {
                        model_exists = true;
                    }
                }
                if (!model_exists)
                    this.non_unique_modelnames.push([sorted_models[i], 2]);
            }
        }
    }


    get_nodes_links_json() { // used in rendere process
        var nodes = [];
        var links = [];
        for (var n in allNodesObj.all_nodes) {
            nodes.push(allNodesObj.all_nodes[n]);
        }
        for (var n in allLinksObj.all_links) {
            links.push(allLinksObj.all_links[n]);
        }
        return { "nodes": nodes, "links": links };
    }


    update_localnetworks_links() {
        var directions = ['outgoing', 'incoming'];
        for (var direct_idx in directions) {
            var direction = directions[direct_idx];
            var opposite_direction = directions[directions.length - direct_idx - 1];
            for (var node_idx in allNodesObj.getAllNodes()) {
                var first_node = allNodesObj.getAllNodes()[node_idx];
                if (first_node.get_protocols_by_abstraction(direction, 'local-networks').length > 0) {
                    var g1_nodes = allNodesObj.getNodesByGroup('1');
                    for (var node_idx2 in g1_nodes) {
                        var second_node = g1_nodes[node_idx2];
                        if (second_node.name != first_node.name) {
                            // a local-networks node shold only connect to others under 3 conditions:
                            // the other node is also of local-networks abstraction,
                            // it's of same-manufacturer and their manufacturer match
                            // it's of manufacturer and their target manufacturers match
                            var accepted_abstractions = ['local-networks', "same-manufacturer", 'manufacturer'];
                            for (var abs_idx in accepted_abstractions) {
                                var current_abstraction = accepted_abstractions[abs_idx];
                                if (second_node.get_protocols_by_abstraction(direction, current_abstraction).length > 0) {
                                    if (current_abstraction == "same-manufacturer" && second_node.manufacturer != first_node.manufacturer) {
                                        continue;
                                    }

                                    var matched_protocols = protocols_match(
                                        first_node.get_protocols_by_abstraction(direction, 'local-networks'),
                                        second_node.get_protocols_by_abstraction(opposite_direction, current_abstraction));
                                    if (current_abstraction == "manufacturer") { // check if the other-manufacturer of the 'manufacturer' node matches the manufacturer of the local-networks node 
                                        matched_protocols = matched_protocols.filter(prtc => prtc.matches_manufacturer(first_node.manufacturer));
                                    }

                                    for (var prot_idx in matched_protocols) {
                                        first_node.set_target_and_save_protocol(direction, 'local-networks', matched_protocols[prot_idx], second_node.name);
                                        var link_uid = allLinksObj.create_uid(second_node.name, "Router");
                                        first_node.add_link_if_not_exists(direction, allLinksObj.getLink_by_uid(link_uid));
                                        var deviceflow = {};
                                        if (direction == "outgoing") {
                                            deviceflow[first_node.name] = "reverse";
                                        }
                                        else {
                                            deviceflow[first_node.name] = "normal";
                                        }

                                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(direction, deviceflow);

                                        second_node.set_target_and_save_protocol(opposite_direction, current_abstraction, matched_protocols[prot_idx], first_node.name);
                                        var link_uid = allLinksObj.create_uid(first_node.name, "Router");
                                        second_node.add_link_if_not_exists(opposite_direction, allLinksObj.getLink_by_uid(link_uid));
                                        var deviceflow = {};
                                        if (direction == "outgoing") {
                                            deviceflow[second_node.name] = "normal";
                                        }
                                        else {
                                            deviceflow[second_node.name] = "reverse";
                                        }

                                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(opposite_direction, deviceflow);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    update_samemanufacturer_links() {
        var directions = ['outgoing', 'incoming'];
        for (var direct_idx in directions) {
            var direction = directions[direct_idx];
            var opposite_direction = directions[directions.length - direct_idx - 1];
            for (var node_idx in allNodesObj.getAllNodes()) {
                var first_node = allNodesObj.getAllNodes()[node_idx];
                if (first_node.get_protocols_by_abstraction(direction, 'same-manufacturer').length > 0) {
                    var g1_nodes = allNodesObj.getNodesByGroup('1');
                    for (var node_idx2 in g1_nodes) {
                        var second_node = g1_nodes[node_idx2];
                        if (second_node.name != first_node.name) {
                            // a local-networks node shold only connect to others under 3 conditions:
                            // the other node is also of local-networks abstraction,
                            // it's of same-manufacturer and their manufacturer match
                            // it's of manufacturer and their target manufacturers match
                            var accepted_abstractions = ['local-networks', "same-manufacturer"];
                            for (var abs_idx in accepted_abstractions) {
                                var current_abstraction = accepted_abstractions[abs_idx];
                                if (second_node.get_protocols_by_abstraction(direction, current_abstraction).length > 0) {
                                    if (current_abstraction == "same-manufacturer" && second_node.manufacturer != first_node.manufacturer) {
                                        continue;
                                    }

                                    var matched_protocols = protocols_match(
                                        first_node.get_protocols_by_abstraction(direction, 'same-manufacturer'),
                                        second_node.get_protocols_by_abstraction(opposite_direction, current_abstraction));

                                    for (var prot_idx in matched_protocols) {
                                        first_node.set_target_and_save_protocol(direction, 'same-manufacturer', matched_protocols[prot_idx], second_node.name);
                                        var link_uid = allLinksObj.create_uid(second_node.name, "Router");
                                        first_node.add_link_if_not_exists(direction, allLinksObj.getLink_by_uid(link_uid));
                                        var deviceflow = {};
                                        // deviceflow[first_node.name] = "reverse";
                                        if (direction == "outgoing") {
                                            deviceflow[first_node.name] = "reverse";
                                        }
                                        else {
                                            deviceflow[first_node.name] = "normal";
                                        }
                                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(direction, deviceflow);

                                        second_node.set_target_and_save_protocol(opposite_direction, current_abstraction, matched_protocols[prot_idx], first_node.name);
                                        var link_uid = allLinksObj.create_uid(first_node.name, "Router");
                                        second_node.add_link_if_not_exists(opposite_direction, allLinksObj.getLink_by_uid(link_uid));
                                        var deviceflow = {};
                                        // deviceflow[second_node.name] = "normal";
                                        if (direction == "outgoing") {
                                            deviceflow[second_node.name] = "normal";
                                        }
                                        else {
                                            deviceflow[second_node.name] = "reverse";
                                        }
                                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(opposite_direction, deviceflow);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    update_manufacturer_links() {
        var directions = ['outgoing', 'incoming'];
        for (var direct_idx in directions) {
            var direction = directions[direct_idx];
            var opposite_direction = directions[directions.length - direct_idx - 1];
            for (var node_idx in allNodesObj.getAllNodes()) {
                var first_node = allNodesObj.getAllNodes()[node_idx];
                if (first_node.get_protocols_by_abstraction(direction, 'manufacturer').length > 0) {
                    var g1_nodes = allNodesObj.getNodesByGroup('1');
                    for (var node_idx2 in g1_nodes) {
                        var second_node = g1_nodes[node_idx2];
                        if (second_node.name != first_node.name) {
                            // a local-networks node shold only connect to others under 3 conditions:
                            // the other node is also of local-networks abstraction,
                            // it's of same-manufacturer and their manufacturer match
                            // it's of manufacturer and their target manufacturers match
                            var accepted_abstractions = ['local-networks', "manufacturer"];
                            for (var abs_idx in accepted_abstractions) {
                                var current_abstraction = accepted_abstractions[abs_idx];
                                if (second_node.get_protocols_by_abstraction(direction, current_abstraction).length > 0) {

                                    var matched_protocols = protocols_match(
                                        first_node.get_protocols_by_abstraction(direction, 'manufacturer'),
                                        second_node.get_protocols_by_abstraction(opposite_direction, current_abstraction));
                                    if (current_abstraction == "manufacturer") { // check if the other-manufacturer of the 'manufacturer' node matches the manufacturer of the local-networks node 
                                        matched_protocols = matched_protocols.filter(prtc => prtc.matches_manufacturer(first_node.manufacturer));
                                    }
                                    for (var prot_idx in matched_protocols) {
                                        first_node.set_target_and_save_protocol(direction, 'manufacturer', matched_protocols[prot_idx], second_node.name);
                                        var link_uid = allLinksObj.create_uid(second_node.name, "Router");
                                        first_node.add_link_if_not_exists(direction, allLinksObj.getLink_by_uid(link_uid));
                                        var deviceflow = {};
                                        if (direction == "outgoing") {
                                            deviceflow[first_node.name] = "reverse";
                                        }
                                        else {
                                            deviceflow[first_node.name] = "normal";
                                        }
                                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(direction, deviceflow);

                                        second_node.set_target_and_save_protocol(opposite_direction, current_abstraction, matched_protocols[prot_idx], first_node.name);
                                        var link_uid = allLinksObj.create_uid(first_node.name, "Router");
                                        second_node.add_link_if_not_exists(opposite_direction, allLinksObj.getLink_by_uid(link_uid));
                                        var deviceflow = {};
                                        if (direction == "outgoing") {
                                            deviceflow[second_node.name] = "normal";
                                        }
                                        else {
                                            deviceflow[second_node.name] = "reverse";
                                        }
                                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(opposite_direction, deviceflow);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    update_mycontroller_links() {
        var directions = ['outgoing', 'incoming'];
        for (var direct_idx in directions) {
            var direction = directions[direct_idx];
            var opposite_direction = directions[directions.length - direct_idx - 1];
            // for (var mud_idx = 0; mud_idx < this.mud_with_promises_processed.length; mud_idx++) {
            for (var node_idx in allNodesObj.getAllNodes()) {
                var first_node = allNodesObj.getAllNodes()[node_idx];
                // var current_mud = this.mud_with_promises_processed[mud_idx];
                // var current_protocol_data = current_mud.outgoing_protocols_of_abstractions['my-controller'];
                if (!first_node.is_mycontroller_node() && first_node.get_protocols_by_abstraction(direction, 'my-controller').length > 0) {
                    var current_promise = first_node.get_promise();
                    var my_controller_name = current_promise.get_value_by_key('my-controller-name');
                    var my_controller_IP_Address = current_promise.get_value_by_key('my-controller-IP-address');

                    var mycontroller_exists = allNodesObj.has_mycontroller_supporting_url(first_node.mud_url); 

                    if (!mycontroller_exists) {  // we have to create the my-controller node
                        var controller_node = new Node("0", my_controller_name);
                        controller_node.mark_as_my_controller();
                        controller_node.add_device_if_not_exists(direction, first_node.name);
                        controller_node.add_misc_data('my-controller-IP-address', my_controller_IP_Address);
                        controller_node.add_to_supported_mud_urls(first_node.mud_url);    

                        var controller_to_router_flow = {};
                        if (direction == 'outgoing') {
                            controller_to_router_flow[my_controller_name] = "normal";
                        }
                        else if (direction == 'incoming') {
                            controller_to_router_flow[my_controller_name] = "reverse";
                        }
                        var link_controller_to_router = new Link(my_controller_name, "Router");
                        
                        if (!allLinksObj.add_link_if_not_exists(link_controller_to_router)) { // returns false if it's already there
                            let existing_link = allLinksObj.getLink(link_controller_to_router);
                            existing_link.add_deviceflow_if_not_exists(direction, link_controller_to_router.get_deviceflows(direction)[0]);
                        }
                        allNodesObj.add_node_if_not_exists(controller_node);
                    }
                    else{
                        var controller_node = allNodesObj.get_controller_by_mud_url(first_node.mud_url);   
                    }

                    var my_controller_protocols = first_node.get_protocols_by_abstraction(direction,'my-controller');
                    for (var prot_idx in my_controller_protocols) {
                        first_node.set_target_and_save_protocol(direction, 'my-controller', my_controller_protocols[prot_idx], my_controller_name);
                        var link_uid = allLinksObj.create_uid(my_controller_name, "Router");
                        first_node.add_link_if_not_exists(direction, allLinksObj.getLink_by_uid(link_uid));
                        var deviceflow = {};
                        if (direction == "outgoing") {
                            deviceflow[first_node.name] = "reverse";
                        }
                        else {
                            deviceflow[first_node.name] = "normal";
                        }

                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(direction, deviceflow);

                        controller_node.set_target_and_save_protocol(opposite_direction, 'my-controller', my_controller_protocols[prot_idx], first_node.name);
                        var link_uid = allLinksObj.create_uid(first_node.name, "Router");
                        controller_node.add_link_if_not_exists(opposite_direction, allLinksObj.getLink_by_uid(link_uid));
                        var deviceflow = {};
                        if (direction == "outgoing") {
                            deviceflow[my_controller_name] = "normal";
                        }
                        else {
                            deviceflow[my_controller_name] = "reverse";
                        }

                        allLinksObj.getLink_by_uid(link_uid).add_deviceflow_if_not_exists(opposite_direction, deviceflow);
                    }

                }
            }
            this.ready_to_draw = true;
        }
    }


    fulfill_promises() {
        if (allNodesObj.has_awaiting_promises()) {
            var node_with_promise_name = allNodesObj.pop_node_with_awaiting_promise();
            var node_with_promise = allNodesObj.getNode(node_with_promise_name);
            if (node_with_promise.get_controller_exists_flag()) {
                var alert_message = {
                    type: 'success',
                    title: 'My-Controller Found!',
                    showConfirmButton: true
                };
            }
            else {
                var style =
                    '<style>  \
                        dynamic {color: brown; \
                               font-weight: bold} \
                         input {  \
                                 width: 80%;} \
                 </style>'
                var my_controller_html_content = style +
                    '<p style="border: 1px;"> The device <dynamic>' + node_with_promise.name +
                    '</dynamic> in this network needs its controller to be configured for <dynamic>egress</dynamic> traffic:</p>' +
                    '<div style="border: 1px solid #000000;">';

                var aclType_aclNames = node_with_promise.get_misc_data('acl_types_names');

                my_controller_html_content += '<div style="border: 1px solid #000000; padding-top: 5px; padding-bottom: 10px;"> ACL Type(s): <dynamic>'
                var counter = 1;
                for (var aclType in aclType_aclNames) {
                    my_controller_html_content += aclType;
                    if (counter < Object.keys(aclType_aclNames).length) {
                        my_controller_html_content += '</dynamic>, <dynamic>';
                    }
                    counter += 1;
                }
                my_controller_html_content += '</dynamic><div>';

                var tmp_promise = node_with_promise.get_promise();

                var titles = tmp_promise.get_titles();
                for (var key_idx = 0; key_idx < titles.length; key_idx++) {
                    my_controller_html_content += titles[key_idx] + ': <br><input id="' + titles[key_idx] + '" align="right"><br>';
                }

                my_controller_html_content += '</div></div>';

                my_controller_html_content += '</div>';

                var alert_message = {
                    title: "Configuring My-Controller",
                    html: my_controller_html_content,
                    allowOutsideClick: false
                }
            }
            Swal.fire(alert_message).then(() => {
                if (!node_with_promise.get_controller_exists_flag()) {

                    var titles = tmp_promise.get_titles();
                    for (var title_idx = 0; title_idx < titles.length; title_idx++) {
                        let tmp_input_value = document.getElementById(titles[title_idx]).value;
                        tmp_promise.set_value_by_key(titles[title_idx], tmp_input_value);
                    }
                }

                if (allNodesObj.has_awaiting_promises())
                    this.fulfill_promises();
                else {
                    this.update_mycontroller_links();

                }
            });
        }
        else {
            this.update_mycontroller_links();
            this.ready_to_draw = true;
        }
    }

    create_network() {
        for (var json_idx in this.all_mud_jsons) {
            var current_mud_json = this.all_mud_jsons[json_idx]
            if (!current_mud_json.processed) {
                var current_mud = new Mud(current_mud_json.data, this.non_unique_modelnames);
                current_mud_json.processed = true;
                $("#fileNotLoaded").hide();
                $('#mudSelectionDiv').append('<input id="mudcheckbox"  type="checkbox" name="mudfile"  value="' + current_mud.model + '" checked /><label class="select-deselect-muds__text">' + current_mud.model + '</label><br>');
            }
        }

        this.fulfill_promises();
        this.update_localnetworks_links();
        this.update_samemanufacturer_links();
        this.update_manufacturer_links();

    }
}


//////////////////////////////////////////
//////////////// MUD Node ////////////////
//////////////////////////////////////////

class Mud {
    constructor(mudfile, non_unique_modelnames) {
        this.mudfile = mudfile;
        this.mud_url = find_values_by_key(this.mudfile, 'mud-url')[0];
        this.model = find_model_name(this.mudfile);
        for (var z = 0; z < non_unique_modelnames.length; z++) {
            if (non_unique_modelnames[z][0] == this.model) {
                this.model = this.model + non_unique_modelnames[z][1];
                non_unique_modelnames[z][1] += 1;
                break;
            }
        }

        this.FromDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile, "from-device-policy")[0], "name");
        this.ToDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile, "to-device-policy")[0], "name");
        this.acls = this.extract_acls();
        this.outgoing_protocols_of_abstractions = {};
        this.incoming_protocols_of_abstractions = {};
        this.FromDevicePolicies = [];
        this.FromDeviceAces = [];
        this.FromDeviceControllers = [];
        this.ToDevicePolicies = [];
        this.ToDeviceAces = [];
        this.manufacturer = this.extract_manufacturer()
        this.other_manufacturer = this.extract_others_manufacturer();
        this.extract_device_policies();
        this.extract_mud_links();
    }

    extract_acls() {
        this.ietf_acl = find_values_by_key(this.mudfile, "ietf-access-control-list", true);
        let acls = find_values_by_key(this.ietf_acl, 'acl');
        return acls;
    }

    extract_device_policies() {
        for (var acls_idx1 in this.acls) {
            var current_acl_set = this.acls[acls_idx1];
            for (var acl_idx = 0; acl_idx < current_acl_set.length; acl_idx++) {
                var current_acl = current_acl_set[acl_idx];
                if (this.is_FromDevicePolicy(current_acl)) {
                    this.FromDevicePolicies = this.FromDevicePolicies.concat(current_acl);
                    for (var ace in current_acl['aces']) {
                        var current_aces = current_acl['aces'][ace];
                        // adding the "ace type" to the aces 
                        for (var ace_idx = 0; ace_idx < current_aces.length; ace_idx++) {
                            current_aces[ace_idx].type = current_acl.type;
                        }
                        this.FromDeviceAces = this.FromDeviceAces.concat(current_aces);
                    }
                }
                else if (this.is_ToDevicePolicy(current_acl)) {
                    this.ToDevicePolicies = this.ToDevicePolicies.concat(current_acl);
                    for (var ace in current_acl['aces']) {
                        var current_aces = current_acl['aces'][ace];
                        // adding the "ace type" to the aces 
                        for (var ace_idx = 0; ace_idx < current_aces.length; ace_idx++) {
                            current_aces[ace_idx].type = current_acl.type;
                        }
                        this.ToDeviceAces = this.ToDeviceAces.concat(current_aces);
                    }
                }
            }
        }

    }

    is_FromDevicePolicy(acl) {
        var acl_name = find_values_by_key(acl, 'name');
        for (var ii = 0; ii < this.FromDevicePolicies_names.length; ii++) {
            if (acl_name.indexOf(this.FromDevicePolicies_names[ii]) > -1) {
                return true;
            }
        }
        return false;
    }

    is_ToDevicePolicy(acl) {
        var acl_name = find_values_by_key(acl, 'name');
        for (var ii = 0; ii < this.ToDevicePolicies_names.length; ii++) {
            if (acl_name.indexOf(this.ToDevicePolicies_names[ii]) > -1) {
                return true;
            }
        }
        return false;
    }

    extract_mud_links() {

        var new_node = new Node(String(1), this.model);
        new_node.set_manufacturer(this.manufacturer);
        new_node.set_mud_url(this.mud_url);
        var my_controller_processed = false;
        var controller_processed = false;  // the purpose of this is to prevent properly alert the "controller found"
        let ace_types = { outgoing: this.FromDeviceAces, incoming: this.ToDeviceAces };
        for (var direction in ace_types) {
            var aceList = ace_types[direction];
            var unmached_abstract_found = false;
            var unmatched_aces = [];
            for (var acl_idx = 0; acl_idx < aceList.length; acl_idx++) {
                var ace = aceList[acl_idx];
                var ace_protocol = extract_protocol_from_ace(ace);
                var ace_abstraction = this.get_abstraction_types(ace);

                // each node has a "device" element which indicates which device is linked with that link 
                var abstract_matched = true;
                var new_links = [];
                switch (ace_abstraction) {
                    case "domain-names":
                        var device_to_router_flow = {};  // flow is either "normal" or "reverse"
                        var router_to_internet_flow = {};
                        var dest_to_internet_flow = {};
                        if (direction == 'outgoing') {
                            var destination_name = find_values_by_key(ace, "ietf-acldns:dst-dnsname")[0];
                            device_to_router_flow[this.model] = "normal";
                            router_to_internet_flow[this.model] = "normal";
                            dest_to_internet_flow[this.model] = "reverse";
                        }
                        else if (direction == 'incoming') {
                            var destination_name = find_values_by_key(ace, "ietf-acldns:src-dnsname")[0];
                            device_to_router_flow[this.model] = "reverse";
                            router_to_internet_flow[this.model] = "reverse";
                            dest_to_internet_flow[this.model] = "normal";
                        }

                        var dest_node = new Node("4", destination_name);
                        if (!allNodesObj.add_node_if_not_exists(dest_node)) { // if false is returned, it means node already exists 
                            allNodesObj.getNode(destination_name).add_device_if_not_exists(direction, this.model);
                        }


                        var link_device_to_router = new Link(this.model, "Router");
                        link_device_to_router.add_deviceflow_if_not_exists(direction, device_to_router_flow);

                        new_links.push(link_device_to_router);


                        var link_internet_to_destination = new Link(destination_name, "Internet");
                        link_internet_to_destination.add_deviceflow_if_not_exists(direction, dest_to_internet_flow);

                        new_links.push(link_internet_to_destination);

                        var link_router_to_internet = new Link("Router", "Internet");
                        link_router_to_internet.add_deviceflow_if_not_exists(direction, router_to_internet_flow);

                        new_links.push(link_router_to_internet);

                        ace_protocol.setTarget(destination_name);
                        new_node.add_protocol(direction, ace_abstraction, ace_protocol);

                        break;

                    case "local-networks":
                    case "same-manufacturer":
                    case "manufacturer":
                        var device_to_router_flow = {};
                        if (direction == 'outgoing') {
                            device_to_router_flow[this.model] = "normal";
                        }
                        else if (direction == 'incoming') {
                            device_to_router_flow[this.model] = "reverse";
                        }
                        var link_device_to_router = new Link(this.model, "Router");
                        link_device_to_router.add_deviceflow_if_not_exists(direction, device_to_router_flow);

                        if (ace_abstraction == "manufacturer") {
                            let other_manufacturer = extract_other_manufacturers_from_ace(ace);
                            ace_protocol.set_other_manufacturers(other_manufacturer);
                        }

                        new_links.push(link_device_to_router);
                        new_node.add_protocol(direction, ace_abstraction, ace_protocol);

                        break;

                    case "my-controller":
                        if (!my_controller_processed) {
                            allNodesObj.add_to_nodes_with_awaiting_promise(new_node.name);

                            var aclType_aceNames = this.extract_aclType_aceName_dict();
                            new_node.add_misc_data('acl_types_names', aclType_aceNames);
                            var tmp_promise = new AcePromise('my-controller');
                            if (allNodesObj.has_mycontroller_supporting_url(this.mud_url)) {
                                // this.promise.append({ 'direction': 'egress', 'ace': ace, 'abstraction': 'my-controller', 'keys': ['my-controller-name', 'my-controller-IP-address'], 'values': [existing_mycontroller.id.split(': ')[1], existing_mycontroller.ip_address] });

                                new_node.set_controller_exists_flag();
                                var existing_mycontroller = allNodesObj.get_controller_by_mud_url(this.mud_url);
                                tmp_promise.set_value_by_key('my-controller-name',existing_mycontroller.name );
                                tmp_promise.set_value_by_key('my-controller-IP-address',existing_mycontroller.get_misc_data('my-controller-IP-address') );
                                new_node.set_promise(tmp_promise);

                            }
                            else {
                                // this.promise.append({ 'direction': 'egress', 'ace': ace, 'abstraction': 'my-controller', 'keys': ['my-controller-name', 'my-controller-IP-address'], 'values': [] });
                                new_node.set_promise(tmp_promise);

                            }

                           
                            my_controller_processed = true;
                        }
                         var device_to_router_flow = {};
                            if (direction == 'outgoing') {
                                device_to_router_flow[this.model] = "normal";
                            }
                            else if (direction == 'incoming') {
                                device_to_router_flow[this.model] = "reverse";
                            }
                            var link_device_to_router = new Link(this.model, "Router");
                            link_device_to_router.add_deviceflow_if_not_exists(direction, device_to_router_flow);

                            new_links.push(link_device_to_router);
                            new_node.add_protocol(direction, ace_abstraction, ace_protocol);
                            
                        

                        break;


                    case "controller":

                        var device_to_router_flow = {};
                        if (direction == 'outgoing') {
                            device_to_router_flow[this.model] = "normal";
                        }
                        else if (direction == 'incoming') {
                            device_to_router_flow[this.model] = "reverse";
                        }
                        var link_device_to_router = new Link(this.model, "Router");
                        link_device_to_router.add_deviceflow_if_not_exists(direction, device_to_router_flow);

                        new_links.push(link_device_to_router);
                        // new_node.add_protocol(direction, ace_abstraction, ace_protocol);


                        var controller_class = unique(find_values_by_key(ace, 'controller'));
                        for (var cont_idx in controller_class) {
                            var tmp_controller = controller_class[cont_idx];
                            var controller_node = new Node("0", tmp_controller);
                            if (!allNodesObj.add_node_if_not_exists(controller_node)) { // if false is returned, it means node already exists 

                                if (!controller_processed){
                                    Swal.fire({
                                        type: 'success',
                                        title: 'Controller Found!',
                                        showConfirmButton: true
                                    });    
                                }
                                
                                allNodesObj.getNode(tmp_controller).add_device_if_not_exists(direction, this.model);
                            }
                            else{
                                controller_processed = true ;
                            }


                            var device_to_controller_flow = {};
                            if (direction == 'outgoing') {
                                device_to_controller_flow[this.model] = "reverse";
                            }
                            else if (direction == 'incoming') {
                                device_to_controller_flow[this.model] = "normal";
                            }

                            var link_controller_to_router = new Link(tmp_controller, "Router");
                            link_controller_to_router.add_deviceflow_if_not_exists(direction, device_to_controller_flow);

                            new_links.push(link_controller_to_router);

                            ace_protocol.setTarget(tmp_controller);
                            new_node.add_protocol(direction, ace_abstraction, ace_protocol);

                        }

                        break;

                    default:
                        unmached_abstract_found = true;
                        abstract_matched = false;
                        unmatched_aces.push(ace);
                }
                if (abstract_matched) {
                    for (var link_idx in new_links) {
                        var link_to_add = new_links[link_idx];

                        if (!allLinksObj.add_link_if_not_exists(link_to_add)) { // returns false if it's already there
                            let existing_link = allLinksObj.getLink(link_to_add);
                            existing_link.add_deviceflow_if_not_exists(direction, link_to_add.get_deviceflows(direction)[0]);
                        }

                        new_node.add_link_if_not_exists(direction, link_to_add);
                    }

                    allNodesObj.add_node_if_not_exists(new_node);
                    router_node.add_device_if_not_exists(direction, new_node.name);
                    internet_node.add_device_if_not_exists(direction, new_node.name);
                    // }
                }
            }
            if (unmached_abstract_found == true) {
                let html_message = "<div style='text-align: left; padding: 5px;'>The abstraction of the following ACE(s) is not implemented yet:</div></br>";
                for (var a_idx in unmatched_aces) {
                    html_message += "<pre style='border: 1px solid #555555;text-align: left;'>" + JSON.stringify(unmatched_aces[a_idx], undefined, 2) + "</pre>"
                }
                // html_message += JSON.stringify(ace,undefined,2) + "</pre>";
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: "MUD abstraction of the following ACE is not implemented yet:",
                    html: html_message
                    // footer: '<a href>"abstract "+ abstract + " not implemented"</a>'
                })
            }
        }
    }

    extract_aclType_aceName_dict() {
        // This is a dictionary in this format: {"ipv4-acl-type": ["from-ipv4-amazonecho-0","from-ipv4-amazonecho-1", ...], ... }
        var type_names = {};
        var acl_list = find_values_by_key(this.mudfile, "ietf-access-control-list", true);
        for (var acl_i in acl_list) {
            var current_acl_set = acl_list[acl_i]['acl'];
            for (var item in current_acl_set) {
                var current_acl = current_acl_set[item];
                var current_type = current_acl.type;
                var current_aces = current_acl.aces['ace'];
                type_names[current_type] = [];
                for (var ace_i in current_aces) {
                    var currrent_ace = current_aces[ace_i];
                    type_names[current_type].push(currrent_ace.name);
                }
            }
        }
        return type_names;
    }

    extract_manufacturer() {
        var mud_url = find_values_by_key(this.mudfile, 'mud-url')[0];
        let psl = require('psl');
        return psl.get(this.extractHostname(mud_url));
    }

    extract_others_manufacturer() {
        return this.get_unique_values(find_values_by_key(this.mudfile, "manufacturer"));
    }

    get_unique_values(inp_list) {
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
    
    get_abstraction_types(ace) {
        var abstraction = [];
        var acldns = find_values_by_key(ace, 'ietf-acldns', true);
        var mud_acls = find_values_by_key(ace, "ietf-mud:mud", true);
        if (acldns.length > 0) {
            abstraction = abstraction.concat("domain-names");
        }
        else {
            for (var j = 0; j < mud_acls.length; j++) {
                var current_abstract = Object.keys(mud_acls[j])[0];
                if (!abstraction.includes(current_abstract)) {
                    abstraction = abstraction.concat(Object.keys(mud_acls[j]))
                }
            }
        }
        if (abstraction.length > 1) {
            console.warn("more than one absraction found in a ace");
        }
        return abstraction[0];
    }
}
