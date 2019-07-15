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

function find_values_by_key(json_data, target_key) {
    output = []
    for (var key_ in json_data) {
      if (key_ == target_key){
        // console.log(json_data[key_]);
        output = output.concat([json_data[key_]]);
      }
      else if (typeof (json_data[key_]) == 'object') {
        output = output.concat(find_values_by_key(json_data[key_], target_key));
      }
    }
    return output; 
  } 


function mud_to_nodes(multi_mud_json){
    nodes = []
    links = []
    modelnames = find_values_by_key(multi_mud_json,"model-name");
    unique_modelnames = [... new Set(modelnames)];
    
    group_counter = new Array(unique_modelnames.length).fill(1)
    
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

    for (var current_mud_name in  multi_mud_json){
      var current_mud = multi_mud_json[current_mud_name];
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
                
                label: 'Select Folder',
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
                            global.sharedObj = JSON.stringify(mud_to_nodes(JSON.parse(data))); 
                            console.log("############### The file content is : " + global.sharedObj);
                            mainWindow.webContents.send('ping', 'whoooooooh!')
                        });
                        
                        
                    });
                }
            },
            {
                label: 'Add Item',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Clear Items'
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
        label: "View",
        submenu:[
            {
                label: "Reload",
                accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+Q',
                click(){
                    mainWindow.reload();
                }
            }
        ]
    }
];

