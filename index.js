 /*** DimmableScene Z-Way HA module *******************************************

Version: 1.0
(c) Tim Auton 2017
-----------------------------------------------------------------------------
Author: Tim Auton tim@uton.org
Description:
    Creates a dimmable scene.
    Individual lights can be configured to come on/off and track the master
    with a user-definable curve.
    Switches can be set to turn on and off at defined levels.
******************************************************************************/

// Constructor
function DimmableScene (id, controller) {
	DimmableScene.super_.call(this, id, controller);
}
inherits(DimmableScene, AutomationModule);
_module = DimmableScene;

// Init
DimmableScene.prototype.init = function (config) {
	DimmableScene.super_.prototype.init.call(this, config);
	var self = this;
	
	this.vDev = self.controller.devices.create({
        deviceId: "DimmableScene_" + this.id,
        defaults: {
            deviceType: "switchMultilevel",
            metrics: {
                title: "Dimmable Scene " + this.id,
                icon: "multilevel",
                level: 0
            }
        },
        overlay: {},
        handler: function(command, args) {
        	if (command == "exact") {
				self.config.dimmers.forEach(function(thisDev) {
			
					var vDev = self.controller.devices.get(thisDev.device);
					var setLevel = parseInt(args.level);
				
					// calculate the target level from curve parameters
					var masterScaled = (setLevel-thisDev.minMasterLevel)/(thisDev.maxMasterLevel-thisDev.minMasterLevel);
					var lightScale = thisDev.maxLevel-thisDev.minLevel+1;
					var targetLevel = Math.round(lightScale*Math.pow(masterScaled,thisDev.expo))+thisDev.minLevel;
				
					// below minMasterLevel the above calculation is undefined
					if (isNaN(targetLevel)) {
						targetLevel = thisDev.minLevel;
					}
					// deal with rounding issues
					if (targetLevel < 1) {
						targetLevel = 1;
					} else if (targetLevel > 99) {
						targetLevel = 99;
					}
					// don't go over max or under min
					if (targetLevel < thisDev.minLevel) {
						targetLevel = thisDev.minLevel;
					}
					if (targetLevel > thisDev.maxLevel) {
						targetLevel = thisDev.maxLevel;
					}
					// make sure we're off if we're below the master level, of if master level is zero
					if ((setLevel < thisDev.minMasterLevel && thisDev.offBelowMin)
						|| (setLevel > thisDev.maxMasterLevel && thisDev.offAboveMax)
						|| setLevel == 0
						) {
						targetLevel = 0;
					}
				
					if (vDev) {
						if (!thisDev.setSameLevel || (thisDev.setSameLevel && vDev.get("metrics:level") != targetLevel)) {
							console.log("Dimmable Scene " + self.id + " : Setting " + thisDev.device + " to " + targetLevel);
							vDev.performCommand("exact", { level: targetLevel });
						}
					}
				});
				self.config.switches.forEach(function(thisDev) {
					var vDev = self.controller.devices.get(thisDev.device);
					var setLevel = parseInt(args.level);
				
					var targetLevel = (setLevel >= thisDev.minLevel && setLevel <= thisDev.maxLevel) ? "on" : "off";
				
					if (vDev) {
						if (!thisDev.setSameLevel || (thisDev.setSameLevel && vDev.get("metrics:level") != targetLevel)) {
							vDev.performCommand(targetLevel);
						}
					}
				});
				self.vDev.set("metrics:level",parseInt(args.level));
			}
        },
        moduleId: this.id
    });
};

// Destructor
DimmableScene.prototype.stop = function () {
	DimmableScene.super_.prototype.stop.call(this);
};
