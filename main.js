/*
MIT License

Copyright (c) 2020 Rick MacDonald

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// This is the server side (node.js) part of this Electron application.

const { app, BrowserWindow, dialog, ipcMain} = require('electron')
const url = require('url')
const path = require('path')

var win;
var winHeight;
var connected = false; // this is to track the state of the JS8Call API connection


if(process.platform !== 'darwin')
    winHeight = 640; // make room for the menu bar for windows and linux
else
    winHeight = 600;


const dialogOptions = {
    type: 'question',
    buttons: ['OK', 'Cancel'],
    defaultId: 1,
    title: 'License Agreement',
    message: 'This application is open source software licensed under the MIT license',
    detail: 'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR ' +
        'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, ' +
        'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE ' +
        'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER ' +
        'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, ' +
        'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE ' +
        'SOFTWARE.',
  };
  
function quitApp()
{   app.quit();
}
  
function createWindow() 
{
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: winHeight,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  win.loadURL(url.format ({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  
  // Open the DevTools for testing if needed
  // win.webContents.openDevTools();
  
  win.webContents.on('did-finish-load', () => {
      var title = win.getTitle();
      var version = app.getVersion();
  
      win.setTitle(title + " v" + version);
      
      const firstRun = require('electron-first-run');

      const isFirstRun = firstRun()   
      
      const configPath = path.join(app.getPath('userData'), 'FirstRun', 'electron-app-first-run');
      console.log(configPath);

       
      if(isFirstRun)
      {  
          const dialogResponse = dialog.showMessageBoxSync(null, dialogOptions);      
      
          if(dialogResponse == 1)
          {
            setTimeout(quitApp, 100);
            
            firstRun.clear();
          }
      }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});

// listener for buttonall
ipcMain.on("sendall",(e, data)=>{
  sendToJS8Call(data);
});

// listener for buttonnew
ipcMain.on("sendnew",(e, data)=>{
  sendToJS8Call(data);
});

// listener for buttonrevised
ipcMain.on("sendrevised",(e, data)=>{
  sendToJS8Call(data);
});

function timeoutCheck()
{
    if(connected)
    {
        connected = false; // to check next time
    }
    else
    {
        win.webContents.send('apistatus', "disconnected"); 
    }
}

setInterval(timeoutCheck, 20000);


// **** This is the JS8Call API interface ****

var PORT = 2242;
var HOST = '127.0.0.1';
//var HOST = '224.0.0.1'; // an example multicast address, doen't seem to work for Windows

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var msg = false;
var count = 0;
var reply_to;
var firstMessage = false;
var sending = false;
	
server.on('listening', function() 
{
	var address = server.address();
	//console.log('UDP Server listening on ' + address.address + ':' + address.port);
});

server.on('message', function(message, remote) 
{
	//console.log(remote.address + ':' + remote.port +' - ' + message);
	connected = true; // yes we heard from JS8Call
	win.webContents.send('apistatus', "connected"); // set indicator to green

	reply_to = remote.port;
	msg = true;

	var s = message.toString();
	var o = JSON.parse(s);
	var t = o.type;
	
	if(t == 'RX.ACTIVITY')
	{
	    //console.log(remote.address + ':' + remote.port +' - ' + message);
	    win.webContents.send('activity', s);
	}
});

function isMulticast(addr) // multicast doesn't seem to work for Windows with this
{
	var a = addr.split( '.' );

	var ai = parseInt( a[0], 10 );

	if( ai >=  224 && ai <= 239 )
		return true;
	else
		return false;
}

if( isMulticast(HOST) )
{
	console.log( 'Multicast address' );

	server.bind(PORT, function() {
		//server.setBroadcast(true);
		//server.setMulticastTTL(128);
		server.addMembership(HOST);
	});
}
else
{
	server.bind(PORT, HOST);
}

function callsignList(callsign, callsigns)
{
    callsigns = callsigns + " " + callsign;
    
    return callsigns;
}

function sendToJS8Call(data)
{
    var s = "";
    data.forEach(callsign => s = callsignList(callsign, s));
    
	tm = Date.now();
	
	var msg = '{"type": "TX.SET_TEXT", "value": "' + s + '", "params": {"_ID": ' + tm + '}}';
	//console.log(msg);
			
    message = Buffer.from(msg);

    server.send(message, 0, message.length, reply_to, HOST, function(err, bytes) 
    {
        if (err) throw err;
        //console.log( 'UDP message sent to ' + HOST +':'+ reply_to );
        //console.log(message);
    });		
}

