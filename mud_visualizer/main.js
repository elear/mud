const electron = require('electron');
const url = require('url');
const path = require('path');
const d3 = require('d3');
var fs = require('fs');

const {app, BrowserWindow, Menu} = electron; 

let mainWindow; 
let addWindow; 
// Listen for app to be ready 
app.on('ready',function(){
    //create new window 
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.openDevTools();
    // load html in window 
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname,'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Quit app when closed
    mainWindow.on('closed',function(){
        app.quit();
    })

    //build menu from tempalte
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // insert menu 
    Menu.setApplicationMenu(mainMenu);


});

// handle new windows 
function createAddWindow(){

        //create new window 
        addWindow = new BrowserWindow({
            width: 300, 
            height: 200, 
            title: 'Add shopping list item'
        });
        // load html in window 
        addWindow.loadURL(url.format({
            pathname: path.join(__dirname,'addWindow.html'),
            protocol: 'file:',
            slashes: true
        }));

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


// // this function is only used for aces, and unique children will be used to find the parent
// function find_parent_of_key(json_data, target_key) {
//     output = []
//     for (var key_ in json_data) {
//         if (key_ == target_key){
//             output = output.concat([json_data[key_]]);

//         }
//         else if (typeof (json_data[key_]) == 'object') {
//             output = output.concat(find_values_by_key(json_data[key_], target_key, partial=false));
//     }
//     return output; 
// } 


function mud_to_nodes(multi_mud_json){
    nodes = []
    links = []
    modelnames = find_values_by_key(multi_mud_json,"model-name");
    unique_modelnames = [... new Set(modelnames)];
    
    // group_counter = new Array(unique_modelnames.length).fill(1)
    
    nodes.push({"group":"2","id":"Router"})
    nodes.push({"group":"3","id":"Internet"})
    links.push({"source": "Router","target":"Internet","value": "10"})  

    
    // take out the non-unique values 
    var sorted_models = modelnames.slice().sort();
    var non_unique_models = [];

    for (var i = 0; i < sorted_models.length - 1; i++) {
        if (sorted_models[i + 1] == sorted_models[i]) {
            non_unique_models.push([sorted_models[i],1]);
        }
    }

    // iterate through each mud file
    for (var current_mud_name in  multi_mud_json){
        var current_mud = multi_mud_json[current_mud_name];
        // tmp = new Mud(current_mud);
        model = find_values_by_key(current_mud,'model-name')[0]; 
        for (var z = 0 ; z < non_unique_models.length; z++ ){
            if (non_unique_models[z][0] == model){
                model = model + non_unique_models[z][1]; 
                non_unique_models[z][1] += 1; 
                break;
            }          
        }

        
        var from_device_policies = find_values_by_key(find_values_by_key(current_mud,"from-device-policy"), "name");
        var to_device_policies = find_values_by_key(find_values_by_key(current_mud,"to-device-policy"), "name");
    
        var link_of_current_node = [] ; 
        link_of_current_node.push({"source": "Router","target":"Internet","value": "10"});
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
                nodes.push({"group":String(4),"id":target})
                }
                // check if link is already added 
                if (find_values_by_key(Object.values(links),'source').indexOf(model) == -1  ||  
                    find_values_by_key(Object.values(links),'target').indexOf(target) == -1){
                links.push({"source": model,"target":"Router","value": "10"});
                link_of_current_node.push({"source": model,"target":"Router","value": "10"})

                links.push({"source": "Internet","target":target,"value": "10"});  
                link_of_current_node.push({"source": "Internet","target":target,"value": "10"});  
                }
            }
            
        }
        nodes.push({"group":String(1),"id":model, "links":link_of_current_node});
    }
    
    return {"nodes": nodes, "links": links};
  }

// create menu tempalte 
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                
                label: 'Open',
                accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                click(){
                    const { dialog } = require('electron')
                    dialog.showOpenDialog((fileNames) => {
                        // fileNames is an array that contains all the selected
                        if(fileNames === undefined){
                            console.log("No file selected");
                            return;
                        }
                        
                        var filepath = fileNames[0]
                        fs.readFile(filepath, 'utf-8', (err, data) => {
                            if(err){
                                alert("An error ocurred reading the file :" + err.message);
                                return;
                            }
                            
                            // Change how to handle the file content
                            console.log("The file content is : " + data);
                            
                            test_network = new Mud_Network(JSON.parse(data));
                            test_network.create_network()
                            the_data = test_network.get_nodes_links_json();

                            // global.sharedObj = JSON.stringify(mud_to_nodes(JSON.parse(data))); 
                            global.sharedObj = JSON.stringify(the_data); 
                            console.log("############### The file content is : " + global.sharedObj);
                            mainWindow.webContents.send('ping', 'whoooooooh!')
                        });
                        
                        
                    });
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    },
    {
        label: "Run",
        submenu:[
            {
                label: "Reload",
                accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
                click(){
                    mainWindow.reload();
                }
            }
        ]
    }
]

class Mud_Network {
    constructor(multi_mud_json){
        this.multi_mud_json = multi_mud_json;
        this.allNodes = [];
        this.allLinks = [];
        this.abstractions = [];
        this.Mud_list = [];
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

    create_network(){
        for (var current_mud_name in  this.multi_mud_json){
            var current_mud = new Mud(this.multi_mud_json[current_mud_name], this.non_unique_modelnames, this.allNodes, this.allLinks)
            this.Mud_list = this.Mud_list.concat(current_mud)
        }
        this.updat_localnetworks_links(); 
    }

}


class Mud {
    constructor(mudfile,non_unique_modelnames, allNodes, allLinks) {
        this.mudfile = mudfile; 
        this.model = find_values_by_key(this.mudfile,"model-name")[0];
        for (var z = 0 ; z < non_unique_modelnames.length; z++ ){
            if (non_unique_modelnames[z][0] == this.model){
                this.model = this.model + non_unique_modelnames[z][1]; 
                non_unique_modelnames[z][1] += 1; 
                break;
            }          
        }
        this.FromDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile,"from-device-policy")[0], "name");
        this.ToDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile,"to-device-policy")[0], "name");   
        this.acls = this.extract_acls();
        this.abstractions = [];
        this.FromDevicePolicies = [];
        this.FromDeviceAces = [];
        this.ToDevicePolicies = [];
        this.ToDeviceAces = [];
        this.allNodes = allNodes; 
        this.allLinks = allLinks; 
        this.link_of_current_node = [];
        this.index_in_allnodes = -1;
        this.extract_device_policies();
        this.extract_FromDevice_links();
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
                    this.FromDeviceAces = this.FromDeviceAces.concat(current_acl['aces'][ace]);
                }
            }
            else if (this.is_ToDevicePolicy(current_acl)){
                this.ToDevicePolicies = this.ToDevicePolicies.concat(current_acl);
                for (var ace in current_acl['aces']){
                    this.ToDeviceAces = this.ToDeviceAces.concat(current_acl['aces'][ace]);
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
                
                    if (this.node_is_in_allNodes()) {
                        this.allNodes[this.index_in_allnodes].links = this.allNodes[this.index_in_allnodes].links.concat(this.link_of_current_node);
                        if (!this.allNodes[this.index_in_allnodes].abstractions.includes("domain-names")){
                            this.allNodes[this.index_in_allnodes].abstractions = this.allNodes[this.index_in_allnodes].abstractions.concat("domain-names")
                        }
                    }
                    else{
                        this.index_in_allnodes = this.allNodes.length; 
                        this.allNodes.push({"group":String(1), "id":this.model, "abstractions":["domain-names"] ,"links":this.link_of_current_node});
                    }
                    break;
                case "local-networks":
                    if (!this.is_connected_to_Router()){
                        this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                        this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
                    }
                    if (this.node_is_in_allNodes()){
                        if (!this.allNodes[this.index_in_allnodes].abstractions.includes("local-network")){
                            this.allNodes[this.index_in_allnodes].abstractions = this.allNodes[this.index_in_allnodes].abstractions.concat("local-network")
                        }
                    }
                    else{
                        this.index_in_allnodes = this.allNodes.length; 
                        this.allNodes.push({"group":String(1), "id":this.model, "abstractions":["local-network"] ,"links":this.link_of_current_node});
                    }
                    break;
            }   
        }
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
