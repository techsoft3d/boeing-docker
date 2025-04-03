cameras = [
    // Turbine View
    {
        "position": {
            "x": -557.4823445279757,
            "y": -298.0021919652274,
            "z": 116.76314287683842
        },
        "target": {
            "x": -1008.6983283399313,
            "y": -390.92146169880994,
            "z": 121.7554541108642
        },
        "up": {
            "x": -0.006081622681869791,
            "y": 0.08307305738293867,
            "z": 0.9965249023494629
        },
        "width": 150,
        "height": 150,
        "projection": 1,
        "nearLimit": 0.001,
        "className": "Communicator.Camera"
    },
    // Cockpit View
    {
        "position": {
            "x": -223.86221656029636,
            "y": -0.20765410480520197,
            "z": 250
        },
        "target": {
            "x": -23.905891117051283,
            "y": 3.5912059178083773,
            "z": 248.25742209251646
        },
        "up": {
            "x": 0.008711317543164628,
            "y": 0.00016550152082292328,
            "z": 0.9999620420575517
        },
        "width": 140.04150764194193,
        "height": 140.04150764194193,
        "projection": 1,
        "nearLimit": 0.001,
        "className": "Communicator.Camera"
    },
    // Cabin View
    {
        "position": {
            "x": -1655,
            "y": 0,
            "z": 265
        },
        "target": {
            "x": -1455,
            "y": 0,
            "z": 265
        },
        "up": {
            "x": 0,
            "y": 0,
            "z": 1
        },
        "width": 140.04150764194193,
        "height": 140.04150764194193,
        "projection": 1,
        "nearLimit": 0.001,
        "className": "Communicator.Camera"
    },
    // Left Side of Fuselage
    {
        "position": {
            "x": -64.74109202950604,
            "y": -202.95569930068473,
            "z": 265.5353521659888
        },
        "target": {
            "x": -398.1445744151109,
            "y": -81.81013297601862,
            "z": 175.15585398257514
        },
        "up": {
            "x": -0.2316563888867041,
            "y": 0.08540495960043444,
            "z": 0.9690414389300492
        },
        "width": 366.063633810924,
        "height": 366.063633810924,
        "projection": 1,
        "nearLimit": 0.001,
        "className": "Communicator.Camera"
    },
    // Undercarriage 
    {
        "position": {
            "x": -1139.6303676798295,
            "y": -259.3675122439149,
            "z": 64.09176927056416
        },
        "target": {
            "x": -1298.708881694242,
            "y": -142.08134796174028,
            "z": 33.465276703814865
        },
        "up": {
            "x": -0.12325412281054916,
            "y": 0.09087338655365913,
            "z": 0.9882056713187145
        },
        "width": 199.99999999999994,
        "height": 199.99999999999994,
        "projection": 1,
        "nearLimit": 0.001,
        "className": "Communicator.Camera"
    }
];

function setView(val) {
    if (val >= 0) {
        var camera = Communicator.Camera.construct(cameras[val]);
        hwv.getView().setCamera(camera, 500);
    }
}