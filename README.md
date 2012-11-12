Utility: Foundation on 'roids
=======

A front end framework for serious developers combining everything you love about _Zurb's Foundation_, with an added splash of _Twitter's Bootstrap_. It operates using SCSS and whilst staying independant of Ruby and works on any operating system.

### What? Why?

Utility is not trying to be another framework, it is a wrapper for Foundation that juices it up with some of the more robust features found in Bootstrap. It also acts as a nice starter template for your project's assets/resources folder.

## How to install
1. Download and extract a ZIP of this repo to your project
1. Clone the utility-core repo to __assets/scss/frameworks__
1. Clone the utility-js repo to __assets/javascript/frameworks__
1. Grab a copy of Scout App http://mhs.github.com/scout-app/
1. Install and open Scout App, set up a new Project
1. Point Input folder to __/css__ and Output folder to __/scss__
1. Point JavaScripts folder to __/javascript__ and Images folder to __/images__
1. Point Config File to __/config.rb__
1. Set Environment: __Production__ and Output Type: __Compact__
1. Laugh at how easy that was

## SASS Folders and their meaning
- __/app__ - Contains modifications, controls, mixins that are application specific
- __/frameworks__ - Contains Compass, Foundation and Utility frameworks
- __/pages__ - Styles for a single page eg: _home_
- __/templates__ - Styles for a page template eg: _default_
         
## So how is this better than just using Foundation?
At this stage the following components have been improved

1. __Buttons__
The buttons have a sexier look, with extra classes: ``inverse``, ``warning`` and ``info``

1. __Tabs__
Add ``bottom`` to tabs for bottoms up orientation

1. __Labels__
Add ``big`` to any label for oversized version: ``<span class="label big round">1</span>``

## What's this about Bootstrap?
These features have been ported from Bootstrap

1. __Image Styles__ 
Add ``circle``, ``polaroid`` or ``rounded`` to and IMG tag

1. __Hero Unit__ 
Showcase component - Usage: ``<div class="hero-unit"><h1>Heading</h1><p>Tagline</p></div>``

## What else can it do?
There are some unique features too

1. __Icons__
Includes Font Awesome icon pack - http://fortawesome.github.com/Font-Awesome/

1. __Image Shadows__
Try adding .img-shadow to an image wrapper - Usage: ``<div class="img-shadow circle"><img src="..." class="circle" /></div>``

1. __Separators__
Add ``separator`` to any div with: ``bottom`` or ``right`` - Usage: ``<div class="separator bottom shadow">Content here</div>``

1. __Link Buttons__
A more subtle version of a button - Usage: ``<a href="#" class="link_button">Link</a>``

1. __Star Rating__
Star ratings - Usage: ``<p class="star-rating"><i class="rating-25"></i> <span> based on 2 reviews</span></p>``

1. __Quantity Input__
Adds up / down arrows to an input field - Usage: ``<input class="input-quantity" type="text" name="quantity" value="1" />``

1. __Progress Tracker__
A step navigation, aka. progress tracker - Usage: 
```html
<ol class="progress-tracker four-up">
    <li class="active"><em>1</em><span>Choose Life</li>
    <li><em>2</em><span>Choose a job</li>
    <li><em>3</em><span>Choose a career</li>
    <li><em>4</em><span>Choose a family</li>
</ol>```