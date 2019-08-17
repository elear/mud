<a href="https://github.com/Vafa-Andalibi/MUD-Visualizer/blob/readme/README.md"><img src="https://github.com/Vafa-Andalibi/MUD-Visualizer/blob/readme/img/other_icons/github_logo.png?sanitize=true" width="60%"></a>

# Manufacturer Usage Description (MUD) Visualizer
> Warning: MUD-Visualizer is currently beta. Use at your own risk.

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) 
[![Github Issues](http://img.shields.io/github/issues/Vafa-Andalibi/MUD-Visualizer/bug.svg)](https://github.com/Vafa-Andalibi/MUD-Visualizer/issues)
[![Github Issues](http://img.shields.io/github/issues/Vafa-Andalibi/MUD-Visualizer/enhancement.svg)](https://github.com/Vafa-Andalibi/MUD-Visualizer/issues)
[![Github Issues](http://img.shields.io/github/issues-pr/Vafa-Andalibi/MUD-Visualizer.svg)](https://github.com/Vafa-Andalibi/MUD-Visualizer/pulls)


This tool can be used to visualize the MUD files in JSON format.

![MUD-Visualizer](img/recordit/recordit.gif)

## Table of Contents 

- [Motivation](#Motivation)
- [Installation](#installation)
- [Supported MUD Abstractions](#features)
- [Contributing](#contributing)
- [Team](#team)
- [FAQ](#faq)
- [Support](#support)
- [License](#license)

## Motivation

MUD files are plain text files in JSON format that contain ACL rules for a device. A MUD file can contains tens or hundrends of ACL rules which makes it difficult to read and validate the files manually. MUD-Visualizer will help you to read and validate (and modify in near future) the MUD files.  

## Installation

Use the following commands to install and run `MUD-Visualizer`: 

```shell
$ git clone https://github.com/Vafa-Andalibi/MUD-Visualizer
$ cd MUD-Visualizer
$ npm install
$ npm start
```

## Supported MUD Abstractions

Currently the following MUD abstractions are supported in both `incoming` and `outgoing` traffic directions: 

- `domain-names`
- `local-networks`
- `same-manufacturer`
- `manufacturer`
- `my-controller`
- `controller`

## Support

Reach out to me at one of the following places!

- Website at <a href="http://andalibi.me" target="_blank">`www.andalibi.me`</a>
- Twitter at <a href="http://twitter.com/vafandal" target="_blank">`@vafandal`</a>

You are strongly encouraged to use Github's <a href="https://github.com/Vafa-Andalibi/MUD-Visualizer/issues" target="_blank">Issues</a> to submit new issues, or request enhancements or new features.

## License

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) 

- **[BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause)**
- Copyright 2019 © <a href="https://www.cisco.com/" target="_blank">Cisco Systems</a>.