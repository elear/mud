// This file contains the main two class for building the network of mud nodes: MUD_Network, MUD_Promise and MUD

const uuidv4 = require('uuid/v4');
const Swal = require('sweetalert2');


/////////////////////////////////////////////
//////////////// MUD NETWORK ////////////////
/////////////////////////////////////////////

class Mud_Network {
    constructor() {
        this.ready_to_draw = false;
        this.all_mud_jsons = [];
        this.allNodes = [];
        this.allLinks = [];
        this.abstractions = [];
        this.all_mud_objects = [];
        this.allAbstractions = [];
        this.muds_with_controller = 0;  // this includes my-controllers too 
        this.controllers = [];
        this.my_controllers = [];
        this.mud_with_promises_raw = [];
        this.mud_with_promises_processed = [];
        this.all_modelnames = [];
        this.non_unique_modelnames = [];
        this.allNodes.push({ "group": "2", "id": "Router", "abstractions": [], "device": ['Router'] });
        this.allNodes.push({ "group": "3", "id": "Internet", "abstractions": [], "device": ['Internet'] });
    }

    add_mudfile(mud_json) {
        this.all_mud_jsons = this.all_mud_jsons.concat({ 'data': mud_json, 'visible': true, 'processed': false });
        let model_name = find_values_by_key(mud_json, "model-name")[0];
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


    get_nodes_links_json() {
        return { "nodes": this.allNodes, "links": this.allLinks };
    }

    update_localnetworks_links() {
        for (var mud_idx = 0; mud_idx < this.all_mud_objects.length; mud_idx++) {
            var current_mud = this.all_mud_objects[mud_idx];
            if (Object.keys(current_mud.abstraction_protocols).includes("local-networks")) {
                for (var n_idx = 0; n_idx < this.allNodes.length; n_idx++) {
                    var tmp_node = this.allNodes[n_idx];
                    if (current_mud.index_in_allnodes != n_idx &&  // don't connect to itself 
                        tmp_node.group == '1' // &&  // make sure the node is in local network group
                    ) {
                        // a local-network node shold only connect to others under 3 conditions: 
                        // the other node is also of local-network abstraction, 
                        // it's of same-manufacturer and their manufacturer match
                        // it's of manufacturer and their target manufacturers match
                        let accepted_abstractions = ['local-networks', "same-manufacturer", 'manufacturer'];
                        for (var abs_idx in accepted_abstractions) {
                            let current_abstraction = accepted_abstractions[abs_idx];
                            if (Object.keys(tmp_node.abstraction_protocols).includes(current_abstraction)) {
                                // protocols_match(current_mud.abstraction_protocols[current_abstraction],tmp_node.abstraction_protocols[current_abstraction])){
                                // let protocol_data = current_mud.abstraction_protocols[current_abstraction] ; 
                                if ((current_abstraction == "same-manufacturer" && tmp_node.manufacturer != current_mud.manufacturer) ||
                                    (current_abstraction == "manufacturer" && !tmp_node.other_manufacturer.includes(current_mud.manufacturer))) {
                                    continue;
                                }
                                let protocol_data = protocols_match(current_mud.abstraction_protocols[current_abstraction], tmp_node.abstraction_protocols[current_abstraction]);
                                if (protocol_data.length > 0) {
                                    let tmp_link = { "source": "Router", "target": tmp_node.id, "value": "10", "device": [current_mud.model], "protocol_data": protocol_data };

                                    let tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, tmp_link, ['source', 'target']);
                                    if (tmp_idx == -1) {
                                        this.allLinks.push(tmp_link);
                                    }
                                    else {
                                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, current_mud.model);
                                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                                    }

                                    //update links_of_current_node
                                    tmp_idx = index_of_object_in_array_based_on_keys(current_mud.link_of_current_node, tmp_link, ['source', 'target']);
                                    if (tmp_idx == -1) {
                                        current_mud.link_of_current_node.push(tmp_link);
                                    }
                                    else {
                                        current_mud.link_of_current_node[tmp_idx].device = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].device, current_mud.model);
                                        current_mud.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].protocol_data, protocol_data);
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
        for (var mud_idx = 0; mud_idx < this.all_mud_objects.length; mud_idx++) {
            var current_mud = this.all_mud_objects[mud_idx];
            if (Object.keys(current_mud.abstraction_protocols).includes("same-manufacturer")) {
                for (var n_idx = 0; n_idx < this.allNodes.length; n_idx++) {
                    var tmp_node = this.allNodes[n_idx];
                    if (current_mud.index_in_allnodes != n_idx &&
                        tmp_node.group == '1' &&
                        current_mud.manufacturer == tmp_node.manufacturer
                    ) {

                        let accepted_abstractions = ['local-network', 'same-manufacturer']
                        for (var abs_idx in accepted_abstractions) {
                            let current_abstraction = accepted_abstractions[abs_idx];
                            if (Object.keys(tmp_node.abstraction_protocols).includes(current_abstraction)) {
                                if ((current_abstraction == "same-manufacturer") && tmp_node.manufacturer != current_mud.manufacturer) {
                                    continue;
                                }
                                let protocol_data = protocols_match(current_mud.abstraction_protocols[current_abstraction], tmp_node.abstraction_protocols[current_abstraction]);
                                if (protocol_data.length > 0) {
                                    let tmp_link = { "source": "Router", "target": tmp_node.id, "value": "10", "device": [current_mud.model], "protocol_data": protocol_data };

                                    let tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, tmp_link, ['source', 'target']);
                                    if (tmp_idx == -1) {
                                        this.allLinks.push(tmp_link);
                                    }
                                    else {
                                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, current_mud.model);
                                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                                    }

                                    //update links_of_current_node
                                    tmp_idx = index_of_object_in_array_based_on_keys(current_mud.link_of_current_node, tmp_link, ['source', 'target']);
                                    if (tmp_idx == -1) {
                                        current_mud.link_of_current_node.push(tmp_link);
                                    }
                                    else {
                                        current_mud.link_of_current_node[tmp_idx].device = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].device, current_mud.model);
                                        current_mud.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].protocol_data, protocol_data);
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
        for (var mud_idx = 0; mud_idx < this.all_mud_objects.length; mud_idx++) {
            var current_mud = this.all_mud_objects[mud_idx];
            if (Object.keys(current_mud.abstraction_protocols).includes("manufacturer")) {
                for (var n_idx = 0; n_idx < this.allNodes.length; n_idx++) {
                    var tmp_node = this.allNodes[n_idx];
                    if (current_mud.index_in_allnodes != n_idx &&
                        tmp_node.group == '1' &&
                        current_mud.other_manufacturer.includes(tmp_node.manufacturer)) {

                        let accepted_abstractions = ['local-network', 'manufacturer'];
                        for (var abs_idx in accepted_abstractions) {
                            let current_abstraction = accepted_abstractions[abs_idx];
                            if (Object.keys(tmp_node.abstraction_protocols).includes(current_abstraction)) {
                                if (current_mud.other_manufacturer.includes(tmp_node.manufacturer)) {
                                    let protocol_data = protocols_match(current_mud.abstraction_protocols[current_abstraction], tmp_node.abstraction_protocols[current_abstraction]);
                                    if (protocol_data.length > 0) {
                                        let tmp_link = { "source": "Router", "target": tmp_node.id, "value": "10", "device": [current_mud.model], "protocol_data": protocol_data };

                                        let tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, tmp_link, ['source', 'target']);
                                        if (tmp_idx == -1) {
                                            this.allLinks.push(tmp_link);
                                        }
                                        else {
                                            this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, current_mud.model);
                                            this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                                        }

                                        //update links_of_current_node
                                        tmp_idx = index_of_object_in_array_based_on_keys(current_mud.link_of_current_node, tmp_link, ['source', 'target']);
                                        if (tmp_idx == -1) {
                                            current_mud.link_of_current_node.push(tmp_link);
                                        }
                                        else {
                                            current_mud.link_of_current_node[tmp_idx].device = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].device, current_mud.model);
                                            current_mud.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                                        }

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
        for (var mud_idx = 0; mud_idx < this.mud_with_promises_processed.length; mud_idx++) {
            var current_mud = this.mud_with_promises_processed[mud_idx];
            var current_protocol_data = current_mud.abstraction_protocols['my-controller'];
            for (var prom_idx = 0; prom_idx < current_mud.promise.data.length; prom_idx++) {
                var current_promise_data = current_mud.promise.data[prom_idx];
                let tmp_idx = current_promise_data.keys.indexOf('my-controller-name');
                let my_controller_name = "my-controller: " + current_promise_data.values[tmp_idx];

                let node_controller = { "group": String(0), "id": my_controller_name, "abstractions": ["my-controller"], "device": [current_mud.model] };
                tmp_idx = index_of_object_in_array_based_on_keys(this.allNodes, node_controller, ['group', 'id']);
                if (tmp_idx == -1) {
                    this.allNodes.push(node_controller);
                }
                else {
                    this.allNodes[tmp_idx].device = concat_if_not_exists(this.allNodes[tmp_idx].device, current_mud.model);
                }

                let link_router_to_mycontroller = { "source": "Router", "target": my_controller_name, "value": "10", "device": [current_mud.model], "protocol_data": current_protocol_data };
                // update all_links
                tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_router_to_mycontroller, ['source', 'target']);
                if (tmp_idx == -1) {
                    this.allLinks.push(link_router_to_mycontroller);
                }
                else {
                    this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, current_mud.model);
                    this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, current_protocol_data);
                }

                //update links_of_current_node
                tmp_idx = index_of_object_in_array_based_on_keys(current_mud.link_of_current_node, link_router_to_mycontroller, ['source', 'target']);
                if (tmp_idx == -1) {
                    current_mud.link_of_current_node.push(link_router_to_mycontroller);
                }
                else {
                    current_mud.link_of_current_node[tmp_idx].device = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].device, current_mud.model);
                    current_mud.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].protocol_data, current_protocol_data);
                }
            }
            if (!current_mud.node_is_in_allNodes()) {
                current_mud.index_in_allnodes = this.allNodes.length;
                this.allNodes.push({ "group": String(1), "id": current_mud.model, "abstraction_protocols": current_mud.abstraction_protocols, "links": current_mud.link_of_current_node, "manufacturer": current_mud.manufacturer, "device": [current_mud.model] });
            }
        }
        this.ready_to_draw = true;
    }

    has_promise() {
        if (this.mud_with_promises_raw.length > 0) {
            return true;
        }
        return false;
    }

    fulfill_promises() {
        if (this.has_promise()) {
            var tmp_mud = this.mud_with_promises_raw[0];
            var style =
                '<style>  \
                        dynamic {color: brown; \
                               font-weight: bold} \
                         input {  \
                                 width: 80%;} \
                 </style>'
            var egress_html = style +
                '<p style="border: 1px;"> The device <dynamic>' + tmp_mud.model +
                '</dynamic> in this network needs its controller to be configured for <dynamic>egress</dynamic> traffic:</p>' +
                '<div style="border: 1px solid #000000;">';

            var ingress_html = style +
                '<p style="border: 1px;"> The device <dynamic>' + tmp_mud.model +
                '</dynamic> in this network needs its controller to be configured for <dynamic>ingress</dynamic> traffic:</p>';


            var ace_types = unique(find_values_by_key(tmp_mud.promise, 'type'));
            for (var type_idx = 0; type_idx < ace_types.length; type_idx++) {
                egress_html += '<div style="border: 1px solid #000000; padding-top: 5px; padding-bottom: 10px;"> ACL Type: <dynamic>' + ace_types[type_idx] + '</dynamic><div>';
                var current_ace_type = ace_types[type_idx];
                for (var promise_idx = 0; promise_idx < tmp_mud.promise.length(); promise_idx++) {

                    var tmp_promise = tmp_mud.promise.data[promise_idx];
                    if (tmp_promise.ace.type == current_ace_type) {
                        for (var key_idx = 0; key_idx < tmp_promise.keys.length; key_idx++) {
                            egress_html += tmp_promise.keys[key_idx] + ': <br><input id="' + tmp_promise.input_id[key_idx] + '" align="right"><br>';
                        }
                    }
                }
                egress_html += '</div></div>';
            }
            egress_html += '</div>';
            ingress_html += '</div>';
            Swal.fire({
                title: "Configuring My-Controller",
                html: egress_html,
                allowOutsideClick: false
            }).then(() => {
                // store the user input values in the mud objects
                for (var dat_idx = 0; dat_idx < tmp_mud.promise.data.length; dat_idx++) {
                    for (var key_idx = 0; key_idx < tmp_mud.promise.data[dat_idx].keys.length; key_idx++) {
                        let tmp_input_id = tmp_mud.promise.data[dat_idx].input_id[key_idx];
                        let tmp_input_value = document.getElementById(tmp_input_id).value;
                        tmp_mud.promise.data[dat_idx].values = tmp_mud.promise.data[dat_idx].values.concat(tmp_input_value);
                    }
                }
                // process the next mud object that has promise, otherwise update the links and draw
                this.mud_with_promises_processed = this.mud_with_promises_processed.concat(this.mud_with_promises_raw[0]);
                this.mud_with_promises_raw.shift();
                if (this.has_promise())
                    this.fulfill_promises();
                else
                    this.update_mycontroller_links();
            });
        }
        else {
            this.ready_to_draw = true;
        }
    }

    create_network() {
        for (var current_mud_name in this.all_mud_jsons) {
            if (!this.all_mud_jsons[current_mud_name].processed) {
                var current_mud = new Mud(this.all_mud_jsons[current_mud_name].data, this.non_unique_modelnames, this.allNodes, this.allLinks, this.allAbstractions, this.promise);
                if (current_mud.has_promise()) {
                    this.mud_with_promises_raw = this.mud_with_promises_raw.concat(current_mud);
                }

                this.all_mud_objects = this.all_mud_objects.concat(current_mud);
                this.all_mud_jsons[current_mud_name].processed = true;
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


///////////////////////////////////////
//////////////// promise //////////////
///////////////////////////////////////

class Mud_Promise {
    constructor(uuid, model) {
        this.uuid = uuid;
        this.model = model;
        this.data = [];
    }

    isempty() {
        if (this.data.length == 0) {
            return true;
        }
        return false;
    }

    append(promise_data) {
        promise_data.input_id = []
        for (var dat_idx = 0; dat_idx < promise_data.keys.length; dat_idx++) {
            promise_data.input_id = promise_data.input_id.concat(uuidv4());
        }
        this.data = this.data.concat(promise_data);
    }

    length() {
        return this.data.length;
    }
}

//////////////////////////////////////////
//////////////// MUD Node ////////////////
//////////////////////////////////////////

class Mud {
    constructor(mudfile, non_unique_modelnames, allNodes, allLinks, allAbstractions) {
        this.mudfile = mudfile;
        this.model = find_values_by_key(this.mudfile, "model-name")[0];
        for (var z = 0; z < non_unique_modelnames.length; z++) {
            if (non_unique_modelnames[z][0] == this.model) {
                this.model = this.model + non_unique_modelnames[z][1];
                non_unique_modelnames[z][1] += 1;
                break;
            }
        }
        this.uuid = uuidv4();
        this.promise = new Mud_Promise(this.uuid, this.model);
        this.FromDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile, "from-device-policy")[0], "name");
        this.ToDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile, "to-device-policy")[0], "name");
        this.acls = this.extract_acls();
        this.allAbstractions = allAbstractions;
        this.abstraction_protocols = {};
        this.FromDevicePolicies = [];
        this.FromDeviceAces = [];
        this.FromDeviceControllers = [];
        this.ToDevicePolicies = [];
        this.ToDeviceAces = [];
        this.ToDeviceControllers = [];
        this.allNodes = allNodes;
        this.allLinks = allLinks;
        this.link_of_current_node = [];
        this.index_in_allnodes = -1;
        this.number_protocol_mapping = { "1": "ICMP", "6": "TCP", "17": "UDP" }
        this.manufacturer = this.extract_manufacturer()
        this.other_manufacturer = this.extract_others_manufacturer();
        this.extract_device_policies();
        this.extract_FromDevice_links();
    }

    has_promise() {
        if (this.promise.isempty()) {
            return false;
        }
        return true;
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

    extract_FromDevice_links() {
        for (var acl_idx = 0; acl_idx < this.FromDeviceAces.length; acl_idx++) {
            var ace = this.FromDeviceAces[acl_idx];

            let transport;
            for (var k in ace.matches) {
                if (k.includes("ip")) {
                    transport = k;
                    break;
                }
            }

            let protocol_num = find_values_by_key(ace, "protocol")[0];
            let protocol = this.number_protocol_mapping[protocol_num];

            let source_port = find_values_by_key(ace, "source-port");
            let source_port_number = find_values_by_key(source_port, "port");

            let destination_port = find_values_by_key(ace, "destination-port");
            let destination_port_number = find_values_by_key(destination_port, "port");

            let protocol_data = { "transport": transport, "protocol": protocol, "source_port": source_port_number, "destination_port": destination_port_number };

            var abstract = this.get_abstract_types(ace);
            // add the abstraction to this mud instance if it's not there yet: 
            if (Object.keys(this.abstraction_protocols).includes(abstract)) {
                this.abstraction_protocols[abstract] = concat_if_not_exists(this.abstraction_protocols[abstract],protocol_data);
            }
            else {
                this.abstraction_protocols[abstract] = [protocol_data]
            }
            if (!this.allAbstractions.includes(abstract)) {
                this.allAbstractions = this.allAbstractions.concat(abstract);
            }

            var abstract_matched = true;
            switch (abstract) {
                case "domain-names":
                    var destination = find_values_by_key(ace, "ietf-acldns:dst-dnsname")[0];
                    if (!this.allNodes_includes(destination)) {
                        this.allNodes.push({ "group": String(4), "id": destination, "abstractions": ["domain-names"], device: [this.model] });
                    }
                    else {
                        let tmp_idx = find_values_by_key(Object.values(this.allNodes), 'id').indexOf(destination);
                        if (!this.allNodes[tmp_idx].device.includes(this.model))
                            this.allNodes[tmp_idx].device = this.allNodes[tmp_idx].device.concat(this.model);
                    }
                    let link_device_to_router = { "source": this.model, "target": "Router", "value": "10", "device": [this.model], "protocol_data": [protocol_data] };

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_device_to_router);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_device_to_router);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }

                    let link_internet_to_destination = { "source": "Internet", "target": destination, "value": "10", "device": [this.model], "protocol_data": [protocol_data] };

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_internet_to_destination, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_internet_to_destination);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_internet_to_destination, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_internet_to_destination);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }

                    let link_router_to_internet = { "source": "Router", "target": "Internet", "value": "10", "device": [this.model], "protocol_data": [protocol_data] };

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_router_to_internet, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_router_to_internet);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_router_to_internet, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_router_to_internet);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }

                    break;

                case "local-networks":
                case "same-manufacturer":
                case "manufacturer":
                    let link_device_to_router_ = { "source": this.model, "target": "Router", "value": "10", "device": [this.model], "protocol_data": [protocol_data] };
                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router_, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_device_to_router_);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router_, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_device_to_router_);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }
                    break;

                case "my-controller":
                    this.promise.append({ 'direction': 'egress', 'ace': ace, 'abstraction': 'my-controller', 'keys': ['my-controller-name', 'my-controller-IP-address'], 'values': [] });
                    let link_device_to_router_my_cont = { "source": this.model, "target": "Router", "value": "10", "device": [this.model], "protocol_data": [protocol_data] };


                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router_my_cont, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_device_to_router_my_cont);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router_my_cont, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_device_to_router_my_cont);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }
                    break;

                case "controller":
                    var controller_class = unique(find_values_by_key(ace, 'controller'))[0];
                    let link_device_to_router_cont = { "source": this.model, "target": "Router", "value": "10", "device": [this.model], "protocol_data": [protocol_data] };

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router_cont, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_device_to_router_cont);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router_cont, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_device_to_router_cont);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }

                    let node_controller = { "group": String(0), "id": controller_class, "abstractions": ["controller"], "device": [this.model], "protocol_data": [protocol_data] };
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allNodes, node_controller, ['group', 'id']);
                    if (tmp_idx == -1) {
                        this.allNodes.push(node_controller);
                    }
                    else {
                        this.allNodes[tmp_idx].device = concat_if_not_exists(this.allNodes[tmp_idx].device, this.model);
                    }

                    let link_router_to_controller = { "source": "Router", "target": controller_class, "value": "10", "device": [this.model], "protocol_data": [protocol_data] };

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_router_to_controller, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.allLinks.push(link_router_to_controller);
                    }
                    else {
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model);
                        this.allLinks[tmp_idx].protocol_data = concat_if_not_exists(this.allLinks[tmp_idx].protocol_data, protocol_data);
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_router_to_controller, ['source', 'target']);
                    if (tmp_idx == -1) {
                        this.link_of_current_node.push(link_router_to_controller);
                    }
                    else {
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model);
                        this.link_of_current_node[tmp_idx].protocol_data = concat_if_not_exists(this.link_of_current_node[tmp_idx].protocol_data, protocol_data);
                    }

                    break
                case "same-model":
                    console.log("not implemented");
                default:
                    abstract_matched = false;
            }
            if (abstract_matched && abstract != "my-controller" && !this.node_is_in_allNodes()) {
                this.index_in_allnodes = this.allNodes.length;
                this.allNodes.push({ "group": String(1), "id": this.model, "abstraction_protocols": this.abstraction_protocols, "links": this.link_of_current_node, "manufacturer": this.manufacturer, "other_manufacturer": this.other_manufacturer, device: [this.model] });
            }
        }
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

    node_is_in_allNodes() {
        return (this.index_in_allnodes != -1)
    }

    allNodes_includes(node) {
        return (find_values_by_key(Object.values(this.allNodes), 'id').indexOf(node) != -1)
    }

    is_connected_to_Router() {
        return (find_values_by_key(Object.values(this.allLinks), 'source').indexOf(this.model) != -1)
    }

    get_abstract_types(ace) {
        var abstract_types = [];
        var mud_acls = find_values_by_key(ace, "ietf-mud:mud", true)
        if (mud_acls.length == 0) {
            abstract_types = abstract_types.concat("domain-names");
        }
        else {
            for (var j = 0; j < mud_acls.length; j++) {
                var current_abstract = Object.keys(mud_acls[j])[0];
                if (!abstract_types.includes(current_abstract)) {
                    abstract_types = abstract_types.concat(Object.keys(mud_acls[j]))
                }
            }
        }
        if (abstract_types.length > 1) {
            console.warn("more than one absraction found in a ace");
        }
        return abstract_types[0];
    }
}
