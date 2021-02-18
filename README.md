u-r-grounded
============

A NodeJS web app for easily blocking internet access for devices via pfSense NAT rules


Prerequisites
-------------

You must install and configure the API for pfSense (see https://github.com/jaredhendrickson13/pfsense-api).


pfSense Setup
-------------

1. Create an alias (Firewall &rarr; Aliases) for each device to be blocked.
2. Create firewall rules on the LAN adapter to block each alias.  Be sure to create the rules before/above the final "Default allow LAN to any rule" rule.
   a. Action: `Reject`
   b. Disabled: `Disable this rule` (checked)
   c. Interface: `LAN`
   d. Address Family: `IPv4+IPv6`
   e. Protocol: `Any`
   f. Source: `Single host or alias` and enter/select the alias


Config
------
Copy `config.js.example` to `config.js` and set the options below.

 - devices:
   - `alias_name` : `friendly device name`
 - http_port: HTTP port to listen on
 - pfsense:
   - `address` - The DNS or IP address of pfSense
   - `protocol` - The procotol (HTTP or HTTPS) used to access pfSense
   - `port` - The TCP port pfSense is listening on
   - `client_id` - The client ID for the pfSense API
   - `client_token` -  The client token for the pfSense API
