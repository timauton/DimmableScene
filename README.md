# DimmableScene

This is a module for the ZWay home automation system: http://http://z-wave.me

This app creates a dimmable scene with highly configurable options for how each light and switch responds to the master light level.

Each light can be configured with individual threshold levels and a response curve. Each switch can be configured to switch on and off at a particular level.

This allows you to smoothly transition from a dim setting with just a couple of lamps at a low level, up to all lights on at maximum brightness with each light coming on at an appropriate time and responding individually. Switches can also be added to turn on non-dimmable lights or other accessories at a desired level.

Other accessories which operate as multilevel switches can also be used - you could match your blinds to your light settings or have the colour of a light change with its brightness.

To download from the ZWay app store go to Settings > Management > App Store Access and add the beta key "timauton_beta".

To install manually:

cd /opt/z-way-server/automation/userModules
sudo git clone https://github.com/timauton/DimmableScene.git