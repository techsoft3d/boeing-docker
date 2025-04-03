# Four Models
This repo will walk you through the steps to run a HOOPS Communicator based Linux Streaming Server Docker Container and a companion node-server for static files. 

## Getting Stated 
1. If you do not already have one, create a github token. This can be done here: https://github.com/settings/tokens. Be sure to give yourself full repo acces and write:packages access. 

## Open a terminal and run the following commands to pull the docker containers
1. ```echo <your_github_token> | docker login ghcr.io -u <yourGitHubUserName> --password-stdin```
2. ```docker pull ghcr.io/techsoft3d/streaming-server:latest```
3. ```docker pull ghcr.io/techsoft3d/node-server:latest```

## Add your HOOPS License 
1. Create a file called hoops_license.txt in the root directory of this project
2. Place your license key string in this file without any quotes

## Change to use IP of host server (or localhost if running locally)  
1. Update line 67 of index.html ```var server = new ServerConnection("http://<host_ip>:11182");```

2. Update line 39 of server_config.js ```publicHostname: "<host_ip>```

## Add additional models
1. Place any additional models that you'd like to stream inside of the models directory. These models must be compatible with HC 2025.1.0 or older

## Start Docker Containers
1. From within the root folder of your GitHub repo run ```docker-compose up -d --force-recreate```
* If you do not have docker installed it can be installed from the [docker website](https://www.docker.com/get-started/)

## View template application
1. Open a browser window and navigate to ```http://localhost:3000``` 
               