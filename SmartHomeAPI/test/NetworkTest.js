/**
 * SmartHome Network Discovery Test
 */

// Require the Chai Assertion Library
var expect = require("chai").expect;

// Require the module we are testing...
var NetworkDiscover = require("../APICore/NetworkDiscover.js");

describe("SmartHome Network Discovery Test\n", function () { // Name the test...

    describe("Network Detects Devices", function () {  // Name the equivalence partition...

        // Perform the test, with the "done" parameter-function:
        it("Should properly detect devices and have the required information for each device.", function (done) {

            // Allow the test to run for this amount of time (should be reasonable)
            this.timeout(1000 * 60 * 3);

            // Scan the Network
            scan = new NetworkDiscover.scan();

            // When the network discover is complete:
            scan.on("discovery complete", function (devices) {

                // Expect the devices object to be a JavaScript Object:
                expect(devices instanceof Object).to.equal(true);

                if(devices) { // If we did find network devices, make sure they have the required keys

                    for(var i in devices) {
                        expect(devices[i].name).not.to.be.null;
                        expect(devices[i].address).not.to.be.null;
                        expect(devices[i].mac).not.to.be.null;

                        expect(devices[i].name).not.to.be.undefined;
                        expect(devices[i].address).not.to.be.undefined;
                        expect(devices[i].mac).not.to.be.undefined;
                    }
                }

                // Tell the test we are done testing...
                done();

            });

        });

    })

});