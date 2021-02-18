// Native packages
var https = require('https');

// Local packages
var Config = require('./config');
console.log('CONFIG', Config);

// NPM packages
var express = require('express');
var async = require('async');
var axios = require('axios');
var morgan = require('morgan');

// Helper/alias variables
var pfsense_url = `${Config.pfsense.protocol}://${Config.pfsense.address}:${Config.pfsense.port}`;
var pfsense_auth = `${Config.pfsense.client_id} ${Config.pfsense.client_token}`;
var firewall_rules = {};


// Get firewall rules
get_firewall_rules(function(){});
function get_firewall_rules(callback) {
    axios.request({
        method: 'get',
        baseURL: pfsense_url,
        url: `/api/v1/firewall/rule`,
        params: {
            interface: 'lan'
        },
        headers: {
            authorization: pfsense_auth
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function(response) {
        if(response.status==200)
            parse_firewall_rules(response.data.data, callback);
        else
            callback(response.status);
    }).catch(function(error) {
        console.error('ERROR', error);
        callback(error);
    });
}

// Parse the rules output to get only the devices we want
function parse_firewall_rules(data, callback) {
    var parsed = {};

    Object.keys(data).forEach(function(key) {
        var item = data[key];

        // Skip empty source.address
        if(typeof item.source.address=='undefined')
            return;

        var src_addr = item.source.address;

        // Skip any rules that don't match a config'ed device
        if(typeof Config.devices[src_addr]=='undefined')
            return;

        parsed[key] = item;
    });

    firewall_rules = parsed;
    callback(null, parsed);
}


// Disable firewall rule
function disable_firewall_rule(tracker, callback) {
    console.log('disable_firewall_rule(', tracker,')');

    axios.request({
        method: 'put',
        baseURL: pfsense_url,
        url: `/api/v1/firewall/rule`,
        params: {
            interface: 'lan'
        },
        data: {
            tracker: tracker,
            disabled: true,
            apply: true
        },
        headers: {
            authorization: pfsense_auth,
            'content-type': 'application/json'
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function(response) {
        if(response.status==200)
            callback(null, response.data);
        else
            callback(response.status);
    }).catch(function(error) {
        console.error('ERROR', error);
        callback(error);
    });
}


function enable_firewall_rule(tracker, callback) {
    console.log('enable_firewall_rule(', tracker,')');

    axios.request({
        method: 'put',
        baseURL: pfsense_url,
        url: `/api/v1/firewall/rule`,
        params: {
            interface: 'lan'
        },
        data: {
            tracker: tracker,
            disabled: false,
            apply: true
        },
        headers: {
            authorization: pfsense_auth,
            'content-type': 'application/json'
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }).then(function(response) {
        if(response.status==200)
            callback(null, response.data);
        else
            callback(response.status);
    }).catch(function(error) {
        console.error('ERROR', error);
        callback(error);
    });
}


function get_tracker_from_src_address(src_addr) {
    var tracker = undefined;
    Object.keys(firewall_rules).forEach(function(key) {
        var rule = firewall_rules[key];

        if(rule.source.address==src_addr)
            tracker = rule.tracker;
    });

    return tracker;
}


// Web stuffs
var app = express();
app.use(express.static('html'));
app.use(morgan('combined'));


// GET /devices
app.get('/devices', function(req, res) {
    res.json(Config.devices);
});


// GET /rules
app.get('/rules', function(req, res) {
    get_firewall_rules(function(err, data) {
        if(err)
            return res.status(500).send(err);

        res.json(data);
    });
});


// GET /rules/disable/:id -- ENABLE device / disable rule
app.get('/rules/disable/:id', function(req, res) {
    var id = req.params.id;

    var tracker = get_tracker_from_src_address(id);

    disable_firewall_rule(tracker, function(err, data) {
        if(err)
            return res.status(500).send(err);

        res.json(data.data);
    });
});

// GET /rules/enable/:id -- DISABLE device / enable rule
app.get('/rules/enable/:id', function(req, res) {
    var id = req.params.id;

    var tracker = get_tracker_from_src_address(id);

    enable_firewall_rule(tracker, function(err, data) {
        if(err)
            return res.status(500).send(err);

        res.json(data.data);
    });
});

app.listen(Config.http_port, function() {
    console.log('HTTP LISTENING', Config.http_port);
});
