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

You can see a list of the software dependencies in the package.json file

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
