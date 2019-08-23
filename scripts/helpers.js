/////////////////////////////////////////////
//////////////// All Nodes //////////////////
/////////////////////////////////////////////

class AllNodes {
    constructor() {
        this.all_nodes = {};
        this.supporting_mycontroller_urls = [];
        this.nodes_with_promise = [];
    }
    add_node_if_not_exists(node) {
        if (!this.hasNode(node.name)) {
            this.all_nodes[node.name] = node;
            return true;
        }
        return false;
    }
    hasNode(name) {
        return hasKey(this.all_nodes, name);
    }
    getNode(name) {
        return this.all_nodes[name];
    }
    getAllNodes() {
        return this.all_nodes;
    }
    getNodesByGroup(group) {
        var nodes = [];
        for (var n_idx in this.all_nodes) {
            if (this.all_nodes[n_idx].group == group) {
                nodes.push(this.all_nodes[n_idx]);
            }
        }
        return nodes;
    }
    getNodesByMudURL(url) {
        var nodes = [];
        for (var n_idx in this.all_nodes) {
            if (this.all_nodes[n_idx].get_mud_url() == url) {
                nodes.push(this.all_nodes[n_idx]);
            }
        }
        return nodes;
    }
    getNodesByMiscKeyValue(key, value) {
        var nodes = [];
        for (var n_idx in this.all_nodes) {
            if (this.all_nodes[n_idx].get_misc_data(key) == value) {
                nodes.push(this.all_nodes[n_idx]);
            }
        }
        return nodes;
    }
    get_controller_by_mud_url(mud_url) {
        for (var n_idx in this.all_nodes) {
            if (this.all_nodes[n_idx].is_mycontroller_node() && this.all_nodes[n_idx].get_misc_data('supported_mud_urls').indexOf(mud_url) != -1) {
                return this.all_nodes[n_idx];
            }
        }
    }
    has_mycontroller_supporting_url(mud_url) {
        return this.supporting_mycontroller_urls.indexOf(mud_url) != -1;
    }
    add_supporting_my_controller_url(mud_url) {
        this.supporting_mycontroller_urls.push(mud_url);
    }
    add_to_nodes_with_awaiting_promise(node_name) {
        this.nodes_with_promise = concat_if_not_exists(this.nodes_with_promise, node_name);
    }
    has_awaiting_promises() {
        return this.nodes_with_promise.length > 0;
    }
    pop_node_with_awaiting_promise() {
        return this.nodes_with_promise.pop();
    }
}

/////////////////////////////////////////////
//////////////// All Links //////////////////
/////////////////////////////////////////////

class AllLinks {
    constructor() {
        this.all_links = {};
    }
    add_link_if_not_exists(link) {
        if (!this.hasLink(link)) {
            this.all_links[link.uid] = link;
            return true;
        }
        return false;
    }
    hasLink(link) {
        return hasKey(this.all_links, link.uid);
    }
    getLink(link) {
        return this.all_links[link.uid];
    }
    getLink_by_uid(uid) {
        return this.all_links[uid];
    }
    create_uid(source, target) {
        return source + '->' + target;
    }
}

/////////////////////////////////////////////
//////////////// NODE ///////////////////////
/////////////////////////////////////////////

class Node {
    constructor(group, name) {
        this.group = group;
        this.id = name;
        this.name = name;
        this.manufacturer;
        // this.other_manufacturers; 
        this.is_mycontroller = false;
        this.promise;
        this.controller_exists = false;
        this.incoming = {
            'devices': [this.name], // indicates which nodes has relation with this node on incoming traffic
            'links': [],
            "Abstractions": new Abstractions(),
            "promises": []
        };
        this.outgoing = {
            'devices': [this.name], // indicates which nodes has relation with this node on outgoing traffic
            "links": [],
            "Abstractions": new Abstractions(),
            "promises": []
        };
        this.misc_data = [];
    }
    add_device_if_not_exists(traffic_direction, device) {
        this[traffic_direction].devices = concat_if_not_exists(this[traffic_direction].devices, device);
    }
    add_link_if_not_exists(traffic_direction, link) {
        this[traffic_direction].links = concat_if_not_exists(this[traffic_direction].links, link.uid);
        this[traffic_direction].devices = concat_if_not_exists(this[traffic_direction].devices, link.source);
        this[traffic_direction].devices = concat_if_not_exists(this[traffic_direction].devices, link.target);
    }
    add_protocol(traffic_direction, abstraction, protocol) {
        if (abstraction == 'domain-names' && protocol.target == null) {
            console.error("protocol does not have a target");
        }
        this[traffic_direction].Abstractions.add_protocol(abstraction, protocol);
    }

    set_manufacturer(manufacturer) {
        this.manufacturer = manufacturer;
    }
    set_target_and_save_protocol(traffic_direction, inp_abstraction, inp_protocol, target) {
        var tmp_protocol = new Protocol();
        tmp_protocol.copy_from(inp_protocol);
        tmp_protocol.setTarget(target);
        this.add_protocol(traffic_direction, inp_abstraction, tmp_protocol);
    }
    set_mycontroller(mycontroller_name) {
        this.mycontroller = mycontroller_name;
    }
    get_mycontroller() {
        return this.mycontroller;
    }
    set_controller(controller_name) {
        this.controller = controller_name;
    }
    get_controller() {
        return this.controller;
    }

    set_controller_exists_flag() {
        this.controller_exists = true;
    }
    get_controller_exists_flag() {
        return this.controller_exists;
    }
    get_devices(traffic_direction) {
        return this[traffic_direction].devices;
    }
    get_links(traffic_direction) {
        return this[traffic_direction].links;
    }
    get_protocols(traffic_direction) {
        return this[traffic_direction].Abstractions.get_all_protocols();
    }
    get_protocols_by_abstraction(traffic_direction, abstraction) {
        return this[traffic_direction].Abstractions.get_protocol_by_abstraction(abstraction);
    }
    get_group1_devices(traffic_direction) {
        var group1_device_names = [];
        for (var dev_idx in this[traffic_direction].devices) {
            var current_device_name = this[traffic_direction].devices[dev_idx];
            if (allNodesObj.getNode(current_device_name).group == "1") {
                group1_device_names.push(current_device_name);
            }
        }
        return group1_device_names;
    }
    set_promise(promise) {
        this.promises = promise;
    }
    get_promise() {
        return this.promises;
    }
    add_directional_promise(traffic_direction, promise) {
        this[traffic_direction].promises.push(promise);
    }
    get_directional_promise(traffic_direction, promise) {
        return this[traffic_direction].promises.push(promise);
    }
    set_mud_url(url) {
        this.mud_url = url;
    }
    get_mud_url() {
        return this.mud_url;
    }
    add_misc_data(key, value) {
        this.misc_data[key] = value;
    }
    get_misc_data(key) {
        return this.misc_data[key];
    }
    add_to_supported_mud_urls(mud_url) {
        this.misc_data['supported_mud_urls'].push(mud_url);
        allNodesObj.add_supporting_my_controller_url(mud_url);
    }
    mark_as_my_controller() {
        this.is_mycontroller = true;
        this.misc_data['supported_mud_urls'] = [];
    }
    is_mycontroller_node() {
        return this.is_mycontroller == true;
    }
    mark_as_controller() {
        this.is_controller = true;
    }
    is_controller_node() {
        return this.is_controller == true;
    }
    is_controlle_or_mycontroller() {
        return this.is_controller == true || this.is_mycontroller == true;
    }
}


/////////////////////////////////////////////
//////////////// link ///////////////////////
/////////////////////////////////////////////

class Link {
    constructor(source, target) {
        this.source = source;
        this.target = target;
        this.uid = this.get_uid();
        this.incoming = {
            'device:flow': [], // in this format: {name: flow_direction } where flow_direction is normal or reverse
            "Abstractions": new Abstractions()
        };
        this.outgoing = {
            'device:flow': [],
            "Abstractions": new Abstractions()
        };
    }
    add_deviceflow_if_not_exists(traffic_direction, device_flow) {
        if (typeof (device) == "string") {
            console.error("the device:flow should be an object device:flowdirection")
        }
        this[traffic_direction]['device:flow'] = concat_if_not_exists(this[traffic_direction]['device:flow'], device_flow);
    }
    get_deviceflows(traffic_direction) {
        return this[traffic_direction]['device:flow'];
    }
    get_uid() {
        return this.source + '->' + this.target;
    }
}

/////////////////////////////////////////////
//////////////// Protocol ///////////////////
/////////////////////////////////////////////

class Protocol {
    constructor(transport, network, src_dst_ports_tuples) {
        this.src_dst_ports_tuples = [];

        transport ? this.transport = transport : this.transport = ["any"];
        if (typeof (this.transport) == 'string') {
            this.transport = this.transport.split();
        };

        network ? this.network = network : this.network = ["any"];
        if (typeof (this.network) == 'string') {
            this.network = this.network.split();
        };

        if (!src_dst_ports_tuples || src_dst_ports_tuples.length == 0) {
            this.src_dst_ports_tuples.push(['any', 'any']);
        }
        else if (src_dst_ports_tuples.length == 2 && typeof (src_dst_ports_tuples[0]) != "object") { // something like ['any',80]
            this.src_dst_ports_tuples.push(src_dst_ports_tuples);
        }
        else {
            this.src_dst_ports_tuples = src_dst_ports_tuples;
        }
    }
    toObject() {
        return { "transport": this.transport, "network": this.network, "src_dst_ports_tuples": this.src_dst_ports_tuples };
    }
    setTarget(target) {
        this.target = target;
    }
    set_other_manufacturers(other_manufacturers) {
        this.other_manufacturers = other_manufacturers;
    }
    matches_manufacturer(manufacturer) {
        if (this.other_manufacturers == manufacturer) {
            return true;
        }
        return false;
    }
    copy_from(protocol) {
        this.transport = protocol.transport;
        this.network = protocol.network;
        this.src_dst_ports_tuples = protocol.src_dst_ports_tuples;
    }
}


/////////////////////////////////////////////
//////////////// ProtocolSet ////////////////
/////////////////////////////////////////////

class ProtocolSet {
    constructor() {
        this.protocols = [];
    }
    append_if_not_exists(new_protocol) {
        var is_new_protocol = true;
        for (var pr_idx in this.protocols) {
            var tmp_protocol = this.protocols[pr_idx];

            // check if an exact copy exists
            if (tmp_protocol.target == new_protocol.target &&
                tmp_protocol.transport == new_protocol.transport &&
                tmp_protocol.network == new_protocol.network &&
                compare_port_tuples(tmp_protocol.src_dst_ports_tuples, new_protocol.src_dst_ports_tuples)) {
                is_new_protocol = false;
                break;
            }
        }
        if (is_new_protocol) {
            this.protocols.push(new_protocol);
        }
    }
    get_protocols() {
        return this.protocols;
    }
}
/////////////////////////////////////////////
//////////////// Abstractions ////////////////
/////////////////////////////////////////////

class Abstractions {
    constructor() {
        this.domain_protocols = new ProtocolSet();
        this.localnetworks_protocols = new ProtocolSet();
        this.samemanufacturer_protocols = new ProtocolSet();
        this.manufacturer_protocols = new ProtocolSet();
        this.mycontroller_protocols = new ProtocolSet();
        this.controller_protocols = new ProtocolSet();
        this.samemodel_protocols = new ProtocolSet();
        this.all_protocols = [];
    }
    add_protocol(abstraction, protocol) {
        switch (abstraction) {
            case "domain-names":
                this.domain_protocols.append_if_not_exists(protocol);
                break;
            case "local-networks":
                this.localnetworks_protocols.append_if_not_exists(protocol);
                break;
            case "same-manufacturer":
                this.samemanufacturer_protocols.append_if_not_exists(protocol);
                break;
            case "manufacturer":
                this.manufacturer_protocols.append_if_not_exists(protocol);
                break;
            case "my-controller":
                this.mycontroller_protocols.append_if_not_exists(protocol);
                break;
            case "controller":
                this.controller_protocols.append_if_not_exists(protocol);
                break
            case "same-model":
                this.samemodel_protocols.append_if_not_exists(protocol);
                break;
        }
    }
    get_protocol_by_abstraction(abstraction) {
        switch (abstraction) {
            case "domain-names":
                return this.domain_protocols.get_protocols();
            case "local-networks":
                return this.localnetworks_protocols.get_protocols();
            case "same-manufacturer":
                return this.samemanufacturer_protocols.get_protocols();
            case "manufacturer":
                return this.manufacturer_protocols.get_protocols();
            case "my-controller":
                return this.mycontroller_protocols.get_protocols();
            case "controller":
                return this.controller_protocols.get_protocols();
            case "same-model":
                return this.samemodel_protocols.get_protocols();
        }
    }

    get_all_protocols() {
        this.all_protocols = [];
        this.all_protocols = this.all_protocols.concat(this.domain_protocols.get_protocols());
        this.all_protocols = this.all_protocols.concat(this.localnetworks_protocols.get_protocols());
        this.all_protocols = this.all_protocols.concat(this.samemanufacturer_protocols.get_protocols());
        this.all_protocols = this.all_protocols.concat(this.manufacturer_protocols.get_protocols());
        this.all_protocols = this.all_protocols.concat(this.mycontroller_protocols.get_protocols());
        this.all_protocols = this.all_protocols.concat(this.controller_protocols.get_protocols());
        this.all_protocols = this.all_protocols.concat(this.samemodel_protocols.get_protocols());

        var all_protocols_pruned = []; // this will prune all protocols: cases like 
        var targets = this.get_targets();
        for (var tar_idx in targets) {
            var current_target = targets[tar_idx];
            var target_protocols = this.get_protocols_by_target(current_target);

            if (target_protocols.length > 0) {
                var current_target_merged_protocols = this.merge_protocols(target_protocols);
                all_protocols_pruned = all_protocols_pruned.concat(current_target_merged_protocols);
            }
        }
        return all_protocols_pruned;
    }

    get_protocols_by_target(target) {
        return this.all_protocols.filter(prtc => prtc.target == target);
    }

    get_targets() {
        return [... new Set(find_values_by_key(this.all_protocols, 'target'))];
    }

    create_protocol_tree(protocol_array) {
        // it's important to consider src_port and dst_port as a pair. Think about [70, any ] merged with [any, 80] which would not lead to [any , any]
        var protocol_tree = {};
        var transports = [... new Set(find_values_by_key(protocol_array, 'transport').flat())];
        for (var tr_idx in transports) {
            var current_transport = transports[tr_idx];
            protocol_tree[current_transport] = {};
            var protocols_with_current_transport = protocol_array.filter(p => compare_arrays(p.transport, [current_transport]));
            var networks = [... new Set(find_values_by_key(protocols_with_current_transport, 'network').flat())];
            for (var nt_idx in networks) {
                var current_network = networks[nt_idx];
                protocol_tree[current_transport][current_network] = {};
                var protocols_with_current_protocolnetwork = protocols_with_current_transport.filter(p => compare_arrays(p.network, [current_network]));
                protocol_tree[current_transport][current_network]['src_dst_ports_tuples'] = multiDimensionalUnique(find_values_by_key(protocols_with_current_protocolnetwork, 'src_dst_ports_tuples').flat()); // since this is array of arrays we use multiDimensionalUnique
            }
        }
        return protocol_tree;
    }

    traverse_protocol_tree(protocol_array, target) {
        var recreated_protocols = [];
        for (var transport in protocol_array) {
            var current_transport = protocol_array[transport];
            for (var network in current_transport) {
                var current_network = current_transport[network];
                var src_dst_ports_tuples = current_network['src_dst_ports_tuples'];

                if (src_dst_ports_tuples.length > 0) {
                    var tmp_protocol = new Protocol(transport, network, src_dst_ports_tuples);
                    tmp_protocol.setTarget(target);
                    recreated_protocols.push(tmp_protocol);
                }
            }
        }
        return recreated_protocols;
    }

    merge_protocols(protocol_array) {
        var target = protocol_array[0].target
        var protocol_tree = this.create_protocol_tree(protocol_array);
        var transport_has_any = false;
        if (hasKey(protocol_tree, 'any')) {
            transport_has_any = true;
        }
        var transport_has_any_in_any = false;
        if (transport_has_any && hasKey(protocol_tree['any'], 'any')) {
            transport_has_any_in_any = true;
        }
        for (var transport in protocol_tree) {
            var current_transport = protocol_tree[transport];
            var transport_has_any_key = false;
            if (hasKey(current_transport, 'any')) {
                transport_has_any_key = true;
            }

            for (var network in current_transport) {
                var current_network = current_transport[network];
                var transport_has_current_network_in_any = false;
                if (transport_has_any && hasKey(protocol_tree['any'], network)) {
                    transport_has_current_network_in_any = true;
                }
                var src_dst_ports_tuples = current_network["src_dst_ports_tuples"].slice(0);
                var tuples_to_delete = [];
                for (var tuple_idx in src_dst_ports_tuples) {
                    var current_port_tuple = current_network['src_dst_ports_tuples'][tuple_idx];
                    if (transport != 'any' && network != 'any') {
                        var any_any_port_exists_in_current_transportnetwork = false; 
                        var exists_in_any_of_current_transport = false;
                        var exists_in_network_of_any = false;
                        var exists_in_any_of_any = false;
                        if (!compare_arrays(['any', 'any'], current_port_tuple) && includes_tuple(current_network.src_dst_ports_tuples, ['any', 'any'])) {
                            any_any_port_exists_in_current_transportnetwork = true; 
                        }

                        if (transport_has_any_key) {
                            if (includes_tuple(current_transport['any'].src_dst_ports_tuples, current_port_tuple) ||
                                includes_tuple(current_transport['any'].src_dst_ports_tuples, ['any', 'any'])) {
                                exists_in_any_of_current_transport = true;
                            }
                        }
                        if (transport_has_current_network_in_any) {
                            if (includes_tuple(protocol_tree['any'][network].src_dst_ports_tuples, current_port_tuple) ||
                                includes_tuple(protocol_tree['any'][network].src_dst_ports_tuples, ['any', 'any'])) {
                                exists_in_network_of_any = true;
                            }
                        }
                        if (transport_has_any_in_any) {
                            if (includes_tuple(protocol_tree['any']['any'].src_dst_ports_tuples, current_port_tuple) ||
                                includes_tuple(protocol_tree['any']['any'].src_dst_ports_tuples, ['any', 'any'])) {
                                exists_in_any_of_any = true;
                            }
                        }
                        if (any_any_port_exists_in_current_transportnetwork || 
                            exists_in_any_of_current_transport ||
                            exists_in_network_of_any ||
                            exists_in_any_of_any) {
                            for (var tup_idx in current_network['src_dst_ports_tuples']) {
                                var tmp_tup = current_network['src_dst_ports_tuples'][tup_idx];
                                if (compare_arrays(tmp_tup, current_port_tuple)) {
                                    // current_network["src_dst_ports_tuples"].splice(tup_idx, 1);
                                    tuples_to_delete.push(parseInt(tup_idx));
                                }
                            }
                        }
                    }
                    else if (transport != 'any' && network == 'any') {
                        if (transport_has_any_in_any) {
                            if (includes_tuple(protocol_tree['any']['any'].src_dst_ports_tuples, current_port_tuple) ||
                                includes_tuple(protocol_tree['any']['any'].src_dst_ports_tuples, ['any', 'any'])) {
                                for (var tup_idx in current_network['src_dst_ports_tuples']) {
                                    var tmp_tup = current_network['src_dst_ports_tuples'][tup_idx];
                                    if (compare_arrays(tmp_tup, current_port_tuple)) {
                                        // current_network["src_dst_ports_tuples"].splice(tup_idx, 1);
                                        tuples_to_delete.push(parseInt(tup_idx));
                                    }
                                }
                            }
                        }
                    }
                }
                tuples_to_delete.sort().reverse(); 
                tuples_to_delete.forEach(function(tup_idx){
                    current_network["src_dst_ports_tuples"].splice(tup_idx, 1);
                });
            }
        }
        return this.traverse_protocol_tree(protocol_tree, target);
    }
}


///////////////////////////////////////
////////////// AcePromise /////////////
///////////////////////////////////////

class AcePromise {
    constructor(type) {
        this.type = type;
        this.data = {}
        switch (type) {
            case "my-controller":
                this.data['my-controller-name'] = null;
                this.data['my-controller-IP-address'] = null;
        }

    }

    get_data_length() {
        return Object.keys(this.data).length;
    }

    isfulfilled() {
        if (Object.keys(this.data).indexOf(null) != -1) {
            return false;
        }
        return true;
    }

    get_type() {
        return this.type;
    }

    set_value_by_key(key, value) {
        this.data[key] = value;
    }

    get_titles() {
        return Object.keys(this.data);
    }

    get_value_by_key(key) {
        return this.data[key];
    }

}


