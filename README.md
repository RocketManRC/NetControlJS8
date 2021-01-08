# NetControlJS8
 A NodeJS/Electron application to assist Net Control with JS8Call.
 
# Installation
Make sure you have a recent LTS version of Node.js. I was using Node.js v14.15.3 and NPM 6.14.10.

Clone this repository or download the zip file.

In the application folder install the dependencies:

$ npm install

To run the application:

$ npm start

# Notes
This application uses the UDP API of JS8Call version 2.2.0. It is important that the UDP 
port number in JS8Call matches the port number in this application which is currently
coded to be 2242.

JS8Call can be found here:

http://files.js8call.com/latest.html

The settings in JS8Call to enable the UDP API must be set. This is on the Reporting
tab of the Settings dialog.

![Photo](images/settings2.jpeg)

Also the setting to "Allow sending standard messages without callsign" should NOT be checked.

![Photo](images/settings1.jpeg)

The use of this software is discussed in the following Groups.io topic:

https://groups.io/g/js8call/topic/net_communications_using_js8/79148254

and in the following document:

https://qsl.net/nf4rc/2021/ProposedNetCheckInProtocolV100.pdf 