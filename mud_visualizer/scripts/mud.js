const uuidv4 = require('uuid/v4');
const Swal = require('sweetalert2');
///////////////////////////////////
//////////////// MUD NETWORK 
//////////////////////////////////

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

    updat_localnetworks_links() {
        for (var mud_idx = 0; mud_idx < this.all_mud_objects.length; mud_idx++) {
            var current_mud = this.all_mud_objects[mud_idx];
            if (current_mud.abstractions.includes("local-networks")) {
                for (var n_idx = 0; n_idx < this.allNodes.length; n_idx++) {
                    if (current_mud.index_in_allnodes != n_idx && this.allNodes[n_idx].group == '1') {
                        this.allLinks.push({ "source": "Router", "target": this.allNodes[n_idx].id, "value": "10", "device": [current_mud.model] });
                        current_mud.link_of_current_node.push({ "source": "Router", "target": this.allNodes[n_idx].id, "value": "10", "device": [current_mud.model] });
                    }
                }
            }
        }
    }

    update_samemanufacturer_links() {
        for (var mud_idx = 0; mud_idx < this.all_mud_objects.length; mud_idx++) {
            var current_mud = this.all_mud_objects[mud_idx];
            if (current_mud.abstractions.includes("same-manufacturer")) {
                for (var n_idx = 0; n_idx < this.allNodes.length; n_idx++) {
                    if (current_mud.index_in_allnodes != n_idx &&
                        this.allNodes[n_idx].group == '1' &&
                        current_mud.manufacturer == this.allNodes[n_idx].manufacturer) {
                        this.allLinks.push({ "source": "Router", "target": this.allNodes[n_idx].id, "value": "10", "device": [current_mud.model] });
                        current_mud.link_of_current_node.push({ "source": "Router", "target": this.allNodes[n_idx].id, "value": "10", "device": [current_mud.model] });
                    }
                }
            }
        }
    }

    update_manufacturer_links() {
        for (var mud_idx = 0; mud_idx < this.all_mud_objects.length; mud_idx++) {
            var current_mud = this.all_mud_objects[mud_idx];
            if (current_mud.abstractions.includes("manufacturer")) {
                for (var n_idx = 0; n_idx < this.allNodes.length; n_idx++) {
                    if (current_mud.index_in_allnodes != n_idx &&
                        this.allNodes[n_idx].group == '1' &&
                        current_mud.other_manufacturer.includes(this.allNodes[n_idx].manufacturer)) {
                        this.allLinks.push({ "source": "Router", "target": this.allNodes[n_idx].id, "value": "10", "device": [current_mud.model] });
                        current_mud.link_of_current_node.push({ "source": "Router", "target": this.allNodes[n_idx].id, "value": "10", "device": [current_mud.model] });
                    }
                }
            }
        }
    }

    update_mycontroller_links() {
        for (var mud_idx = 0; mud_idx < this.mud_with_promises_processed.length; mud_idx++) {
            var current_mud = this.mud_with_promises_processed[mud_idx];
            for (var prom_idx = 0; prom_idx < current_mud.promise.data.length; prom_idx++) {
                var current_promise_data = current_mud.promise.data[prom_idx];
                let tmp_idx = current_promise_data.keys.indexOf('my-controller-name');
                let my_controller_name = "my-controller: " + current_promise_data.values[tmp_idx];
                
                    
                let node_controller = { "group": String(0), "id": my_controller_name, "abstractions": ["my-controller"] , "device": [current_mud.model]};
                tmp_idx = index_of_object_in_array_based_on_keys(this.allNodes, node_controller,['group','id']);
                if (tmp_idx == -1){
                    this.allNodes.push(node_controller);    
                }
                else{
                    this.allNodes[tmp_idx].device = concat_if_not_exists(this.allNodes[tmp_idx].device, current_mud.model); 
                }

                let link_router_to_mycontroller = { "source": "Router", "target": my_controller_name, "value": "10", "device": [current_mud.model] };
                // update all_links
                tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_router_to_mycontroller,['source','target']);
                if (tmp_idx == -1){
                    this.allLinks.push(link_router_to_mycontroller);    
                }
                else{
                    this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, current_mud.model); 
                }
                
                //update links_of_current_node
                tmp_idx = index_of_object_in_array_based_on_keys(current_mud.link_of_current_node, link_router_to_mycontroller,['source','target']);
                if (tmp_idx == -1){
                    current_mud.link_of_current_node.push(link_router_to_mycontroller);    
                }
                else{
                    current_mud.link_of_current_node[tmp_idx].device = concat_if_not_exists(current_mud.link_of_current_node[tmp_idx].device, current_mud.model); 
                }


                // if (!current_mud.allNodes_includes(my_controller_name)) {
                //     this.allNodes.push({ "group": String(0), "id": my_controller_name, "abstractions": ["my-controller"] , "device": [current_mud.model]});
                // }
                // this.allLinks.push({ "source": "Router", "target": my_controller_name, "value": "10", "device": [current_mud.model] });
                // current_mud.link_of_current_node = current_mud.link_of_current_node.concat({ "source": "Router", "target": my_controller_name, "value": "10", "device": [current_mud.model] });
            }
            current_mud.index_in_allnodes = this.allNodes.length;
            this.allNodes.push({ "group": String(1), "id": current_mud.model, "abstractions": current_mud.abstractions, "links": current_mud.link_of_current_node, "manufacturer": current_mud.manufacturer, "device": [current_mud.model] });
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
                // '<div style="border: 1px solid #000000;">' +     
                '<p style="border: 1px;"> The device <dynamic>' + tmp_mud.model +
                '</dynamic> in this network needs its controller to be configured for <dynamic>egress</dynamic> traffic:</p>' +
                '<div style="border: 1px solid #000000;">';

            var ingress_html = style +
                // '<div style="border: 1px solid #000000;">' +     
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
        this.updat_localnetworks_links();
        this.update_samemanufacturer_links();
        this.update_manufacturer_links();
    }
}


///////////////////////////////////////
//////////////// promise
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

///////////////////////////////////
//////////////// MUD Node
//////////////////////////////////

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
        this.abstractions = []
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
        return find_values_by_key(this.ietf_acl, 'acl')[0];
    }
    extract_device_policies() {
        for (var acl_idx = 0; acl_idx < this.acls.length; acl_idx++) {
            var current_acl = this.acls[acl_idx];
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
            var abstract = this.get_abstract_types(ace);
            // add the abstraction to this mud instance if it's not there yet: 
            if (!this.abstractions.includes(abstract)) {
                this.abstractions = this.abstractions.concat(abstract);
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
                    let link_device_to_router = { "source": this.model, "target": "Router", "value": "10", "device": [this.model] };
                    
                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router,['source','target']);
                    if (tmp_idx == -1){
                        this.allLinks.push(link_device_to_router);    
                    }
                    else{
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    }
                    
                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router,['source','target']);
                    if (tmp_idx == -1){
                        this.link_of_current_node.push(link_device_to_router);    
                    }
                    else{
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model); 
                    }

                    let link_internet_to_destination = { "source": "Internet", "target": destination, "value": "10", "device": [this.model] };

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_internet_to_destination,['source','target']);
                    if (tmp_idx == -1){
                        this.allLinks.push(link_internet_to_destination);    
                    }
                    else{
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    }
                    
                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_internet_to_destination,['source','target']);
                    if (tmp_idx == -1){
                        this.link_of_current_node.push(link_internet_to_destination);    
                    }
                    else{
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model); 
                    }

                    let link_router_to_internet = { "source": "Router", "target": "Internet", "value": "10", "device": [this.model] }; 

                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_router_to_internet,['source','target']);
                    if (tmp_idx == -1){
                        this.allLinks.push(link_router_to_internet);    
                    }
                    else{
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    }
                    
                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_router_to_internet,['source','target']);
                    if (tmp_idx == -1){
                        this.link_of_current_node.push(link_router_to_internet);    
                    }
                    else{
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model); 
                    }

                    break;

                case "local-networks":
                case "same-manufacturer":
                case "manufacturer":
                    if (!this.is_connected_to_Router()) {
                        this.allLinks.push({ "source": this.model, "target": "Router", "value": "10", "device": [this.model] });
                        this.link_of_current_node.push({ "source": this.model, "target": "Router", "value": "10", "device": [this.model] });
                    }
                    break;
                case "my-controller":
                    this.promise.append({ 'direction': 'egress', 'ace': ace, 'abstraction': 'my-controller', 'keys': ['my-controller-name', 'my-controller-IP-address'], 'values': [] });
                    let link_device_to_router_my_cont = { "source": this.model, "target": "Router", "value": "10", "device": [this.model] };


                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router_my_cont,['source','target']);
                    if (tmp_idx == -1){
                        this.allLinks.push(link_device_to_router_my_cont);    
                    }
                    else{
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router_my_cont,['source','target']);
                    if (tmp_idx == -1){
                        this.link_of_current_node.push(link_device_to_router_my_cont);    
                    }
                    else{
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model); 
                    }


                    // if (!this.is_connected_to_Router()) {
                    //     this.allLinks.push({ "source": this.model, "target": "Router", "value": "10", "device": [this.model] });
                    //     this.link_of_current_node.push({ "source": this.model, "target": "Router", "value": "10", "device": [this.model] });
                    // }
                    break;
                case "controller":
                    var controller_class = unique(find_values_by_key(ace, 'controller'))[0];
                    // this.promise.append({'direction': 'egress', 'ace': ace,  'abstraction': 'controller' ,'keys': ['controller-name', 'controller-IP-address'],'values':[]});
                    

                    let link_device_to_router_cont = { "source": this.model, "target": "Router", "value": "10", "device": [this.model] };
                    
                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_device_to_router_cont,['source','target']);
                    if (tmp_idx == -1){
                        this.allLinks.push(link_device_to_router_cont);    
                    }
                    else{
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    }
                    
                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_device_to_router_cont,['source','target']);
                    if (tmp_idx == -1){
                        this.link_of_current_node.push(link_device_to_router_cont);    
                    }
                    else{
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model); 
                    }



                    let node_controller = { "group": String(0), "id": controller_class, "abstractions": ["controller"], "device": [this.model] };
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allNodes, node_controller,['group','id']);
                    if (tmp_idx == -1){
                        this.allNodes.push(node_controller);    
                    }
                    else{
                        this.allNodes[tmp_idx].device = concat_if_not_exists(this.allNodes[tmp_idx].device, this.model); 
                    }


                    // let link_controller_to_router = { "source": controller_class, "target": "Router", "value": "10", "device": [this.model]};
                    // // update all_links
                    // var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_controller_to_router,['source','target']);
                    // if (tmp_idx == -1){
                    //     this.allLinks.push(link_controller_to_router);    
                    // }
                    // else{
                    //     this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    // }


                    let link_router_to_controller = { "source": "Router", "target": controller_class, "value": "10", "device": [this.model] };
                    
                    // update all_links
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.allLinks, link_router_to_controller,['source','target']);
                    if (tmp_idx == -1){
                        this.allLinks.push(link_router_to_controller);    
                    }
                    else{
                        this.allLinks[tmp_idx].device = concat_if_not_exists(this.allLinks[tmp_idx].device, this.model); 
                    }

                    //update links_of_current_node
                    var tmp_idx = index_of_object_in_array_based_on_keys(this.link_of_current_node, link_router_to_controller,['source','target']);
                    if (tmp_idx == -1){
                        this.link_of_current_node.push(link_router_to_controller);    
                    }
                    else{
                        this.link_of_current_node[tmp_idx].device = concat_if_not_exists(this.link_of_current_node[tmp_idx].device, this.model); 
                    }

                    break
                default:
                    abstract_matched = false;
            }
            if (abstract_matched && abstract != "my-controller" && !this.node_is_in_allNodes()) {
                this.index_in_allnodes = this.allNodes.length;
                this.allNodes.push({ "group": String(1), "id": this.model, "abstractions": this.abstractions, "links": this.link_of_current_node, "manufacturer": this.manufacturer, device: [this.model] });
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
        var mud_acls = find_values_by_key(ace, "ietf-mud", true)
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
