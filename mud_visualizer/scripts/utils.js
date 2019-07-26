function find_values_by_key(json_data, target_key, partial = false) {
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

function unique(inp_list) {
    return [... new Set(inp_list)];
}


function have_common_element(arr1, arr2){
    let common = arr1.filter(x=> arr2.includes(x));
    if (common.length > 0) {
        return true;
    }
    return false; 
}

function set_difference(arr1, arr2){
    return arr1.filter(x=> !arr2.includes(x));
}
