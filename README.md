# SmartDesk Web Application [DRAFT]
> SmartDesk - A smarter more intuitive desk

This repository hold a NodeJS web application that is hosted on a RaspberyPI. It interacts with the desk via GPIO communication.

## Table of Contents
- [Dependencies](#dependencies)
  - [NodeJS](#nodejs)
- [Installation](#installation)
- [How to use](#how-to-use)
- [References](#references)

## Dependencies

### NodeJS

```
# On Raspberry PI
# 1) Download the latest NodeJS Linux Binaries (ARM) for ARMv7. 
#    Note that we are not using LTS
#    https://nodejs.org/en/download/current/
#    For instructions on how to update to the latest version check the following tutorial:
#    http://www.hostingadvice.com/how-to/update-node-js-latest-version/

# 1.1) Follow this step ONLY if you are updating NodeJS to the latest and if you encounter the folllowing error:
#                   npm update check failed                  │
# │           Try running with sudo or get access            │
# │           to the local update config store via           │
# │ sudo chown -R $USER:$(id -gn $USER) /home/kpatch/.config
$ sudo chown -R $USER:$(id -gn $USER) /home/{username}/.config

# 2) Un pack the TAR file. i.e. node-v8.6.0-linux-armv7l.tar.xz
$ tar -xvf node-v8.6.0-linux-armv7l.tar.xz

# 3) cd into the folder
$ cd node-v8.6.0-linux-armv7l

# 4) Copy to /usr/local
$ sudo cp -R * /usr/local/

# 5) Test that Node was installed properly. 
#    The version of your installation should display.
$ node -v
```

### Node Dependencies

You can see the full list of the NodeJS dependencies in the [package.json](https://github.com/ATR-Lab/smartdesk-web-app/blob/develop/package.json) file

- [rpio](https://www.npmjs.com/package/rpio)
- [firebase](https://www.npmjs.com/package/firebase)

## Installation 

```
# In the project directory, type the following command:
$ npm install
```

## How to use
```
# DRAFT - Hack
# In the project directory, type the following command:
$ node index.js
```

## References
