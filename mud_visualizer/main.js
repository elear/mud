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
    
    mainWindow.maximize()
    
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

