Utility: Foundation on 'roids
=======

A front end framework for serious developers combining everything you love about _Zurb's Foundation_, with an added splash of _Twitter's Bootstrap_. It operates using SCSS and whilst staying independant of Ruby and works on any operating system.

### What? Why?

Utility is not trying to be another framework, it is a wrapper for Foundation that juices it up with some of the more robust features found in Bootstrap. It also acts as a nice starter template for your project's assets/resources folder.

## How to install
1. Download extract this repo to your project
1. Grab a copy of Scout App http://mhs.github.com/scout-app/
1. Install and open Scout App, set up a new Project
1. Point Input folder to __/css__ and Output folder to __/scss__
1. Point JavaScripts folder to __/javascript__ and Images folder to __/images__
1. Point Config File to __/config.rb__
1. Set Environment: __Production__ and Output Type: __Compact__
1. Laugh at how easy that was

## SASS Folders and their meaning
- __/app__ :: Contains modifications, controls, mixins that are application specific
- __/frameworks__ :: Contains Compass, Foundation and Utility frameworks
- __/pages__ :: Styles for a single page eg: _home_
- __/templates__ :: Styles for a page template eg: _default_
         
## So how is this better than just using Foundation?
At this stage the following components have been improved

1. __Buttons__ :: The buttons have a sexier look, with extra classes: ``inverse``, ``warning`` and ``info``
1. __Tabs__ :: Add ``bottom`` to tabs for bottoms up orientation
1. __Labels__ :: Add ``big`` to any label for oversized version: ``<span class="label big round">1</span>``

## What else can it do?
There are some extras too

1. __Icons__ :: This library has been pinched straight from Bootstrap, see: http://twitter.github.com/bootstrap/base-css.html#images
1. __Image Rounding__ :: Also pinched from Bootstrap, add ``circle``, ``polaroid`` or ``rounded`` to and IMG tag.
1. __Image Shadows__ :: Try adding .img-shadow to an image wrapper - Example: ```<div class="img-shadow circle"><img src="..." class="circle" /></div>```
