const electron = require('electron');
const url = require('url');
const path = require('path');
const d3 = require('d3');
const fs = require('fs');

const {app, BrowserWindow, Menu} = electron; 

let mainWindow; 
let addWindow; 
// Listen for app to be ready 
app.on('ready',function(){
    //create new window 
    mainWindow = new BrowserWindow({});
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




// create menu tempalte 
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
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
                click(){
                    mainWindow.reload();
                }
            }
        ]
    }
];

