 /*** DimmableScene Z-Way HA module *******************************************

Version: 1.1
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
                title: "Dimmable Scene" + this.id,
                icon: "multilevel",
                level: 0,
                lastLevel: 99
            }
        },
        overlay: {},
        handler: function(command, args) {
        	if (command == "exact") {
        	
				var setLevel = parseInt(args.level);
				setLevel = (setLevel < 0) ? 0 : (setLevel > 99) ? 99 : setLevel;
        	
				self.config.dimmers.forEach(function(thisDev) {
			
					var vDev = self.controller.devices.get(thisDev.device);
				
					// calculate the target level from curve parameters
					var masterScaled = (setLevel-thisDev.minMasterLevel)/(thisDev.maxMasterLevel-thisDev.minMasterLevel+1);
					var lightScale = thisDev.maxLevel-thisDev.minLevel+1;
					var targetLevel = Math.round(lightScale*Math.pow(masterScaled,thisDev.expo))+thisDev.minLevel;
					
					// console.log("Dimmable Scene: initially calculated targetLevel is " + targetLevel);
					
					// below minMasterLevel the above calculation is undefined
					if (isNaN(targetLevel) || setLevel <= thisDev.minMasterLevel) {
						targetLevel = thisDev.minLevel;
					}
					if (setLevel >= thisDev.maxMasterLevel) {
						targetLevel = thisDev.maxLevel;
					}
					
					// deal with rounding issues
					targetLevel = (targetLevel < 1) ? 1 : (targetLevel > 99) ? 99 : targetLevel;
					
					// don't go over max or under min, reverse it to deal with negative slopes
					if (thisDev.minLevel <= thisDev.maxLevel) {
						targetLevel = (targetLevel < thisDev.minLevel) ? thisDev.minLevel : targetLevel;
						targetLevel = (targetLevel > thisDev.maxLevel) ? thisDev.maxLevel : targetLevel;
					} else {
						targetLevel = (targetLevel > thisDev.minLevel) ? thisDev.minLevel : targetLevel;
						targetLevel = (targetLevel < thisDev.maxLevel) ? thisDev.maxLevel : targetLevel;
					}
					
					// make sure we're off if we're below the master level, or if master level is zero
					if ((setLevel < thisDev.minMasterLevel && thisDev.offBelowMin)
						|| (setLevel > thisDev.maxMasterLevel && thisDev.offAboveMax)
						|| setLevel == 0
						) {
						targetLevel = 0;
					}
					
					// see if any of the conditions for skipping the update are met
					var skipUpdate = (setLevel < thisDev.minMasterLevel && thisDev.ignoreBelowMin)
									|| (setLevel > thisDev.maxMasterLevel && thisDev.ignoreAboveMax)
									|| (thisDev.dontSetSameLevel && vDev.get("metrics:level") == targetLevel)
					
					if (vDev && !skipUpdate) {
						console.log("Dimmable Scene " + self.id + " : Setting " + thisDev.device + " to " + targetLevel);
						vDev.performCommand("exact", { level: targetLevel });
					} else {
						console.log("Dimmable Scene " + self.id + " : skipping " + thisDev.device);
					}
				});
				self.config.switches.forEach(function(thisDev) {
					var vDev = self.controller.devices.get(thisDev.device);
				
					var targetLevel = (setLevel >= thisDev.minLevel && setLevel <= thisDev.maxLevel) ? "on" : "off";
				
					var skipUpdate = (setLevel < thisDev.minMasterLevel && thisDev.ignoreBelowMin)
									|| (setLevel > thisDev.maxMasterLevel && thisDev.ignoreAboveMax)
									|| (thisDev.dontSetSameLevel && vDev.get("metrics:level") == targetLevel)
				
					if (vDev && !skipUpdate) {
						vDev.performCommand(targetLevel);
					}
				});
				if (self.vDev.get("metrics:level") != 0 && setLevel != self.vDev.get("metrics:lastLevel")) {
					self.vDev.set("metrics:lastLevel",self.vDev.get("metrics:level"));
				}
				self.vDev.set("metrics:level",setLevel);
			}
        },
        moduleId: this.id
    });
    
	if (self.config.lastLevelButton) {
		this.buttonVDev = self.controller.devices.create({
			deviceId: "DimmableScene_" + this.id + "_button",
			defaults: {
				deviceType: "toggleButton",
				metrics: {
					title: "Dimmable Scene" + this.id + "Last Level"
				}
			},
			overlay: {},
			handler: function(command, args) {
				if (command == "on") {
					var lastLevel = self.vDev.get("metrics:lastLevel");
					var currentLevel = self.vDev.get("metrics:level");
					self.vDev.set("metrics:lastLevel",currentLevel);
					self.vDev.performCommand("exact",{ level: lastLevel });
				}
			},
			moduleId: this.id
		});
	}
};

// Destructor
DimmableScene.prototype.stop = function () {
	if (this.vDev) {
		this.controller.devices.remove(this.vDev.id);
	}
	if (this.buttonVDev) {
		this.controller.devices.remove(this.buttonVDev.id);
	}
	DimmableScene.super_.prototype.stop.call(this);
};
