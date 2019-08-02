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
    if (typeof (val) != "object") {
        if (arr.indexOf(val) == -1)
            arr = arr.concat(val);
    }
    else {
        if (containsObject(arr, val))
            arr = arr.concat(val);
    }
    return arr;
}

// similar to .includes() but for object elements
function containsObject(arr, obj) {
    var i;
    for (i = 0; i < arr.length; i++) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
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
                (cur_src_p.source_port.length == 0 || cur_dst_p.destination_port.length == 0 || cur_src_p.source_port[0] == cur_dst_p.destination_port[0]) &&
                (cur_src_p.destination_port.lenght == 0 || cur_dst_p.source_port.length == 0 || cur_src_p.destination_port[0] == cur_dst_p.source_port[0])
            ) {
                matched_protocols = matched_protocols.concat(cur_src_p);
            }
        }
    }
    return matched_protocols;
}