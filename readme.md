# Dropable effects

This module allows you to drop active effects linked in chat (and other text) on tokens.  
It also prints a list of effects embedded on items (weapons and spells) after rolling.

# Installation

Grab the latest `module.json` link from the Releases page and paste it into the Manifest URL field at the bottom of the Install Module dialog.

# How to use

For weapons and spells, any effect not marked as "Transfer to Actor" will be printed in chat after rolling the item.

You can manually create links by dragging an effect into any text field, and Foundry will generate a document link that looks like `@UUID[...]`.

# Compatibility

**DAE**: 
* References to actor data like `@abilities.str.mod` will not work