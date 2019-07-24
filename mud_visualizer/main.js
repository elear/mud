const electron = require('electron');
const url = require('url');
const path = require('path');
const d3 = require('d3');
var fs = require('fs');

const {app, BrowserWindow, Menu} = electron; 

let mainWindow; 
let addWindow; 
var json_data_loaded = false;
// Listen for app to be ready 
app.on('ready',function(){
    //create new window 
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    
    
    // openninng dev tools 
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

    mainWindow.on('resize', function () {
        var size   = mainWindow.getSize();
        var width  = size[0];
        var height = size[1];
        console.log("width: " + width);
        console.log("height: " + height);
        if (json_data_loaded){
            mainWindow.webContents.send('resize', 'resize')
        }
    });

    //build menu from tempalte
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // insert menu 
    Menu.setApplicationMenu(mainMenu);

});

// handle new windows 
// function createAddWindow(){

//         //create new window 
//         addWindow = new BrowserWindow({
//             width: 300, 
//             height: 200, 
//             title: 'Add shopping list item'
//         });
//         // load html in window 
//         addWindow.loadURL(url.format({
//             pathname: path.join(__dirname,'addWindow.html'),
//             protocol: 'file:',
//             slashes: true
//         }));

// }

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

// create menu tempalte 
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                
                label: 'Open',
                accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                click(){
                    mainWindow.webContents.send('clearsvg', 'clearsvg');
                    const { dialog } = require('electron');
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
                            global.sharedObj = data; 

                            // network = new Mud_Network(JSON.parse(data));
                            // network.create_network()
                            // network_data = network.get_nodes_links_json();

                            // global.sharedObj = JSON.stringify(network_data); 
                            mainWindow.webContents.send('draw', 'draw')
                        });
                        
                        
                    });
                    json_data_loaded = true; 
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

// class Mud_Network {
//     constructor(multi_mud_json){
//         this.multi_mud_json = multi_mud_json;
//         this.allNodes = [];
//         this.allLinks = [];
//         this.abstractions = [];
//         this.Mud_list = [];
//         this.all_modelnames = find_values_by_key(multi_mud_json,"model-name");
//         this.non_unique_modelnames = this.get_non_unique_modelnames();
//         this.allNodes.push({"group":"2","id":"Router","abstractions":[]});
//         this.allNodes.push({"group":"3","id":"Internet","abstractions":[]});
//     }

//     get_non_unique_modelnames(){
//         var sorted_models = this.all_modelnames.slice().sort();
//         var non_unique_models = [];
    
//         for (var i = 0; i < sorted_models.length - 1; i++) {
//             if (sorted_models[i + 1] == sorted_models[i]) {
//                 non_unique_models.push([sorted_models[i],1]);
//             }
//         }
//         return non_unique_models;
//     }

    
//     get_nodes_links_json(){
//         return {"nodes": this.allNodes, "links": this.allLinks};
//     }

//     updat_localnetworks_links(){
//         for (var mud_idx = 0 ; mud_idx < this.Mud_list.length ; mud_idx ++ ){
//             var current_mud = this.Mud_list[mud_idx];
//             if (current_mud.abstractions.includes("local-networks")){
//                 for (var n_idx = 0 ; n_idx < this.allNodes.length ; n_idx++ ){
//                     if (current_mud.index_in_allnodes != n_idx && this.allNodes[n_idx].group == '1') {
//                         this.allLinks.push({"source": "Router","target":this.allNodes[n_idx].id, "value": "10", "device":current_mud.model});
//                         current_mud.link_of_current_node.push({"source": "Router", "target":this.allNodes[n_idx].id,"value": "10", "device":current_mud.model});        
//                     }
//                 }
//             }
//         }
//     }

//     update_samemanufacturer_links(){
//         for (var mud_idx = 0 ; mud_idx < this.Mud_list.length ; mud_idx ++ ){
//             var current_mud = this.Mud_list[mud_idx];
//             if (current_mud.abstractions.includes("same-manufacturer")){
//                 for (var n_idx = 0 ; n_idx < this.allNodes.length ; n_idx++ ){
//                     if (current_mud.index_in_allnodes != n_idx && 
//                         this.allNodes[n_idx].group == '1' &&
//                         current_mud.manufacturer == this.allNodes[n_idx].manufacturer) {
//                             this.allLinks.push({"source": "Router","target":this.allNodes[n_idx].id, "value": "10", "device":current_mud.model});
//                             current_mud.link_of_current_node.push({"source": "Router", "target":this.allNodes[n_idx].id,"value": "10", "device":current_mud.model});        
//                     }
//                 }
//             }
//         }
//     }

//     update_manufacturer_links(){
//         for (var mud_idx = 0 ; mud_idx < this.Mud_list.length ; mud_idx ++ ){
//             var current_mud = this.Mud_list[mud_idx];
//             if (current_mud.abstractions.includes("manufacturer")){
//                 for (var n_idx = 0 ; n_idx < this.allNodes.length ; n_idx++ ){
//                     if (current_mud.index_in_allnodes != n_idx && 
//                         this.allNodes[n_idx].group == '1' &&
//                         current_mud.other_manufacturer.includes(this.allNodes[n_idx].manufacturer)) {
//                             this.allLinks.push({"source": "Router","target":this.allNodes[n_idx].id, "value": "10", "device":current_mud.model});
//                             current_mud.link_of_current_node.push({"source": "Router", "target":this.allNodes[n_idx].id,"value": "10", "device":current_mud.model});        
//                     }
//                 }
//             }
//         }
//     }

//     create_network(){
//         for (var current_mud_name in  this.multi_mud_json){
//             var current_mud = new Mud(this.multi_mud_json[current_mud_name], this.non_unique_modelnames, this.allNodes, this.allLinks)
//             this.Mud_list = this.Mud_list.concat(current_mud)
//         }
//         this.updat_localnetworks_links(); 
//         this.update_samemanufacturer_links();
//         this.update_manufacturer_links();
//     }

// }


// class Mud {
//     constructor(mudfile,non_unique_modelnames, allNodes, allLinks) {
//         this.mudfile = mudfile; 
//         this.model = find_values_by_key(this.mudfile,"model-name")[0];
//         for (var z = 0 ; z < non_unique_modelnames.length; z++ ){
//             if (non_unique_modelnames[z][0] == this.model){
//                 this.model = this.model + non_unique_modelnames[z][1]; 
//                 non_unique_modelnames[z][1] += 1; 
//                 break;
//             }          
//         }
//         this.FromDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile,"from-device-policy")[0], "name");
//         this.ToDevicePolicies_names = find_values_by_key(find_values_by_key(this.mudfile,"to-device-policy")[0], "name");   
//         this.acls = this.extract_acls();
//         this.abstractions = [];
//         this.FromDevicePolicies = [];
//         this.FromDeviceAces = [];
//         this.ToDevicePolicies = [];
//         this.ToDeviceAces = [];
//         this.allNodes = allNodes; 
//         this.allLinks = allLinks; 
//         this.link_of_current_node = [];
//         this.index_in_allnodes = -1;
//         this.manufacturer = this.extract_manufacturer()
//         this.other_manufacturer = this.extract_others_manufacturer();
//         this.extract_device_policies();
//         this.extract_FromDevice_links();
//     }

//     extract_acls() {
//         this.ietf_acl = find_values_by_key(this.mudfile,"ietf-access-control-list", true);
//         return find_values_by_key(this.ietf_acl,'acl')[0];
//     }
//     extract_device_policies() {
//         for (var acl_idx = 0 ; acl_idx < this.acls.length ; acl_idx++){
//             var current_acl = this.acls[acl_idx];
//             if (this.is_FromDevicePolicy(current_acl)){
//                 this.FromDevicePolicies = this.FromDevicePolicies.concat(current_acl);
//                 for (var ace in current_acl['aces']){
//                     this.FromDeviceAces = this.FromDeviceAces.concat(current_acl['aces'][ace]);
//                 }
//             }
//             else if (this.is_ToDevicePolicy(current_acl)){
//                 this.ToDevicePolicies = this.ToDevicePolicies.concat(current_acl);
//                 for (var ace in current_acl['aces']){
//                     this.ToDeviceAces = this.ToDeviceAces.concat(current_acl['aces'][ace]);
//                 }
//             }
//         }        
//     }

//     is_FromDevicePolicy(acl){
//         var acl_name = find_values_by_key(acl,'name'); 
//         for (var ii = 0; ii < this.FromDevicePolicies_names.length; ii++) {
//             if (acl_name.indexOf(this.FromDevicePolicies_names[ii]) > -1) {
//                 return true; 
//             }
//         }
//         return false; 
//     }

//     is_ToDevicePolicy(acl){
//         var acl_name = find_values_by_key(acl,'name'); 
//         for (var ii = 0; ii < this.ToDevicePolicies_names.length; ii++) {
//             if (acl_name.indexOf(this.ToDevicePolicies_names[ii]) > -1) {
//                 return true; 
//             }
//         }
//         return false; 
//     }
    
//     extract_FromDevice_links() {
//         for (var acl_idx = 0 ; acl_idx < this.FromDeviceAces.length ; acl_idx++){
//             var ace = this.FromDeviceAces[acl_idx];
//             var abstract = this.get_abstract_types(ace);
//             // add the abstraction to this mud instance if it's not there yet: 
//             if (!this.abstractions.includes(abstract)){
//                 this.abstractions = this.abstractions.concat(abstract);
//             }
//             var abstract_matched = true;
//             switch(abstract){
//                 case "domain-names":
//                     var destination = find_values_by_key(ace,"ietf-acldns:dst-dnsname")[0];
//                     if (!this.allNodes_includes(destination)) {
//                         this.allNodes.push({"group":String(4),"id":destination, "abstractions":["domain-names"]});
//                     }
                        
//                     this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
//                     this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});

//                     this.allLinks.push({"source": "Internet","target":destination,"value": "10", "device":this.model});  
//                     this.link_of_current_node.push({"source": "Internet","target":destination,"value": "10", "device":this.model});

//                     this.allLinks.push({"source": "Router","target":"Internet","value": "10", "device":this.model})
//                     this.link_of_current_node.push({"source": "Router","target":"Internet","value": "10", "device":this.model})

//                     break;
//                 case "local-networks":
//                 case "same-manufacturer":
//                 case "manufacturer":
//                     if (!this.is_connected_to_Router()){
//                         this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
//                         this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
//                     }
//                     break;
//                 case "my-controller":
//                     var my_controller = {"model": this.model};
//                     mainWindow.webContents.send('my-controller-prompt', my_controller);
                    
//                     if (!this.is_connected_to_Router()){
//                         this.allLinks.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
//                         this.link_of_current_node.push({"source": this.model,"target":"Router","value": "10", "device":this.model});
//                     }
//                     break;
//                 default: 
//                     abstract_matched = false; 
//             }
//             if (abstract_matched && !this.node_is_in_allNodes()){
//                 this.index_in_allnodes = this.allNodes.length; 
//                 this.allNodes.push({"group":String(1), "id":this.model, "abstractions":this.abstractions ,"links":this.link_of_current_node, "manufacturer": this.manufacturer});
//             }   
//         }
//     }
   
//     extract_manufacturer(){
//         var mud_url = find_values_by_key(this.mudfile,'mud-url')[0];
//         let psl = require('psl');
//         return psl.get(this.extractHostname(mud_url)); 
//     }

//     extract_others_manufacturer(){
//         return this.get_unique_values(find_values_by_key(this.mudfile,"manufacturer"));
//     }

//     get_unique_values(inp_list){
//         return [... new Set(inp_list)];
//     }

//     extractHostname(url) {
//         var hostname;
//         //find & remove protocol (http, ftp, etc.) and get hostname
    
//         if (url.indexOf("//") > -1) {
//             hostname = url.split('/')[2];
//         }
//         else {
//             hostname = url.split('/')[0];
//         }
    
//         //find & remove port number
//         hostname = hostname.split(':')[0];
//         //find & remove "?"
//         hostname = hostname.split('?')[0];
    
//         return hostname;
//     }

//     node_is_in_allNodes(){
//         return (this.index_in_allnodes != -1)
//     }

//     allNodes_includes(node){
//         return (find_values_by_key(Object.values(this.allNodes),'id').indexOf(node) != -1)
//     }

//     is_connected_to_Router(){
//         return (find_values_by_key(Object.values(this.allLinks),'source').indexOf(this.model) != -1)
//     }

//     get_abstract_types(ace){
//         var abstract_types = []; 
//         var mud_acls = find_values_by_key(ace,"ietf-mud", true)
//         if (mud_acls.length == 0){
//             abstract_types = abstract_types.concat("domain-names");
//         }
//         else{ 
//             for (var j = 0 ; j < mud_acls.length ; j++){
//                 var current_abstract = Object.keys(mud_acls[j])[0];
//                 if (!abstract_types.includes(current_abstract)){
//                     abstract_types = abstract_types.concat(Object.keys(mud_acls[j]))
//                 }
//             }
//         }
//         if (abstract_types.length > 1){
//             console.warn("more than one absraction found in a ace");
//         }
//         return abstract_types[0]; 
//     }
// }
