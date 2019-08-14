function find_values_by_key(json_data, target_key, partial = false) {
    // This function is used to find the all values of a particular key in an object (recursive).
    // Note that nested objects will also be traveresed.
    // If partial flag is on, the key will match even if target_key is a substring of the key. 
    output = []
    for (var key_ in json_data) {
        if (partial === false) {
            if (key_ == target_key) {
                output = output.concat([json_data[key_]]);
            }
            else if (typeof (json_data[key_]) == 'object') {
                output = output.concat(find_values_by_key(json_data[key_], target_key, partial = false));
            }
        }
        else if (partial === true) {
            if (key_.includes(target_key)) {
                output = output.concat([json_data[key_]]);
            }
            else if (typeof (json_data[key_]) == 'object') {
                output = output.concat(find_values_by_key(json_data[key_], target_key, partial = true));
            }
        }
    }
    return output;
}


// returns the unique elements of an array
function unique(inp_list) {
    return [... new Set(inp_list)];
}

// checks if two arrays have any common elements. 
function have_common_element(arr1, arr2) {
    let common = arr1.filter(x => arr2.includes(x));
    if (common.length > 0) {
        return true;
    }
    return false;
}

// returns the set difference between the elements of two arrays: 
// equivalent to arr1 - arr2 
function set_difference(arr1, arr2) {
    return arr1.filter(x => !arr2.includes(x));
}

// similar to .indexOf() but for objects 
function index_of_object_in_array(arr, obj) {
    // this function returns the index of an object if it exists in an array
    for (var x in arr) {
        if (JSON.stringify(arr[x]) == JSON.stringify(obj))
            return x;
    }
    return -1;
}

// similar to .includes() but returns true if part of the keys matches in the objects in the array and obj. 
// for instance if obj = {a:1,b:2, c:3}, keys = ['a','c'], then an object like {a:1, c:3, d:$} in arr will match 
function index_of_object_in_array_based_on_keys(arr, obj, keys) {
    // this function looks into an array and if there is an item where all the keys have same value will return it 
    for (var x in arr) {
        let all_keys_matched = true;
        for (var k in keys) {
            let tmp_key = keys[k];
            // check if key exists in both items 
            if (Object.keys(arr[x]).includes(tmp_key) && Object.keys(obj).includes(tmp_key)) {
                if (arr[x][tmp_key] != obj[tmp_key]) {
                    all_keys_matched = false;
                    break;
                }
            }
        }
        if (all_keys_matched) {
            return parseInt(x);
        }
    }
    return -1;
}

// will concat the object or element to an array only if it doesn't exists
function concat_if_not_exists(arr, val) {
    if (arr == null) {
        arr = [];
    }
    if (typeof (val) != "object") {
        if (arr.indexOf(val) == -1)
            arr.push(val);
    }
    else if (Object.prototype.toString.call(val) === '[object Array]') { // val is array itself
        for (var item_idx in val) {
            let tmp_item = val[item_idx];
            concat_if_not_exists(arr, tmp_item);
        }
    }
    else { // val is object 
        if (!containsObject(arr, val))
            arr.push(val);
    }
    return arr;
}

// similar to .includes() but for object elements
function containsObject(arr, obj) {
    var i;
    for (i = 0; i < arr.length; i++) {
        // if (arraysEqual(Object.keys(arr[i]), Object.keys(arr[i]) )
        if (ObjsAreEqual(arr[i], obj)) {
            return true;
        }
    }
    return false;
}

function has_element_with_key(arr, key) {
    var i;
    for (i = 0; i < arr.length; i++) {
        if (Object.keys(arr[i]).includes(key)) {
            return true;
        }
    }
    return false;
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (var i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

function ObjsAreEqual(a, b) {
    var aProps = Object.getOwnPropertyNames(a),
        bProps = Object.getOwnPropertyNames(b);

    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}

// check the two sets of protocols and returns the common working protocol
// for instance a TCP with source_port = 100 and destination_port = 200 will not match
//  the same TCP with source_port = 100 and destination_port = 200 but will match 
// TCP with source_port = 200 and destination_port = 100 
function protocols_match(src_protocols, dst_protocols) {
    let matched_protocols = [];
    for (var sp_idx in src_protocols) {
        cur_src_p = src_protocols[sp_idx];
        for (var dp_idx in dst_protocols) {
            cur_dst_p = dst_protocols[dp_idx];
            if ((cur_src_p.transport == null || cur_dst_p.transport == null || cur_src_p.transport == cur_dst_p.transport) &&
                (cur_src_p.protocol == null || cur_dst_p.protocol == null || cur_src_p.protocol[0] == cur_dst_p.protocol[0]) &&
                (cur_src_p.source_port.length == 0 || cur_dst_p.source_port.length == 0 || cur_src_p.source_port[0] == cur_dst_p.source_port[0]) &&
                (cur_src_p.destination_port.length == 0 || cur_dst_p.destination_port.length == 0 || cur_src_p.destination_port[0] == cur_dst_p.destination_port[0])
            ) {
                matched_protocols = concat_if_not_exists(matched_protocols, cur_dst_p);
            }
        }
    }
    return matched_protocols;
}


function find_networking_protocol(ace) {
    for (var k in ace.matches) {
        if (k.includes("ip")) {
            return k;
        }
    }
    if (ace.type.includes("ipv4"))
        return "ipv4";
    if (ace.type.includes("ipv6"))
        return "ipv6";
    return undefined;
}

function extract_protocol_from_ace(ace){
    let number_to_transport_mapping = { "1": "ICMP", "2": "IGMP", "6": "TCP", "17": "UDP" }; 

    let protocol_num = find_values_by_key(ace, "protocol")[0];
    let transport = number_to_transport_mapping[protocol_num];

    let networking = find_networking_protocol(ace);

    let src_port_info = find_values_by_key(ace, "source-port");
    let src_port = find_values_by_key(src_port_info, "port");

    let dst_port_info = find_values_by_key(ace, "destination-port");
    let dst_port = find_values_by_key(dst_port_info, "port");

    return new Protocol(transport, networking, src_port, dst_port);
}

function get_outgoing_related_nodes(model_name, links) {
    let outgoing_related_nodes = []
    for (var l_idx in links) {
        let link = links[l_idx];
        for (var dev_i in link.device) {
            if (link.device[dev_i][model_name] != null) {
                let direction_arr = Object.keys(link.device[dev_i][model_name]);
                if (direction_arr.includes('outgoing')) {
                    outgoing_related_nodes = concat_if_not_exists(outgoing_related_nodes, link.source);
                    outgoing_related_nodes = concat_if_not_exists(outgoing_related_nodes, link.target);
                }
            }
        }
    }
    return outgoing_related_nodes;
}

function get_incoming_related_nodes(model_name, links) {
    let incoming_related_nodes = []
    for (var l_idx in links) {
        let link = links[l_idx];
        for (var dev_i in link.device) {
            if (link.device[dev_i][model_name] != null) {
                let direction_arr = Object.keys(link.device[0][model_name]);
                if (direction_arr.includes('incoming')) {
                    incoming_related_nodes = concat_if_not_exists(incoming_related_nodes, link.source);
                    incoming_related_nodes = concat_if_not_exists(incoming_related_nodes, link.target);
                }
            }
        }
    }
    return incoming_related_nodes;
}

function find_model_name(mudfile) {
    let model_name = find_values_by_key(mudfile, "model-name")[0];
    if (model_name == null)
        model_name = find_values_by_key(mudfile, "systeminfo")[0];
    if (model_name == null)
        return "unknown"
    else
        return model_name
}

function hasKey(obj,key){
    return Object.keys(obj).includes(key); 
}

function getKey(obj){ // assumes object has only one key/value
    return Object.keys(obj)[0];
}

function getValue(obj){ // assumes object has only one key/value
    return Object.values(obj)[0];
}