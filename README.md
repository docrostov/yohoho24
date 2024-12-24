# yohoho24
Simplistic Crimbo automation script for 2024 Holiday Season. Made to work for people who are me. Loathers are welcome to take this to the group.

# Installation
To install, run:

```
git checkout docrostov/yohoho24 main
```

# Usage
Run `yoho help` for a rundown on the commands. The options are meant to be submitted within one command, not two; an example of what I tend to run is:

```
yoho island=xmas turns=100 CONSUME
```

There are also two preferences you can set, if you'd like!

- The script's default valuation of the various "spirit of X" drops is **3500**. This is based on some general vague math that I did early this Crimbo. If you would like to set a different value, set the `valueOfSpirit` property. For example, if you would like to value spirits higher to push up the threshold for some of the buffs applied, run the following command in the Graphical CLI: `set valueOfSpirit = 5000`
- The script's default familiar is November's IOTM familiar, the **Peace Turkey**, as it helps with the NC for the noncombats, HP/MP recovery, and has a useful mall-valuable drop in Whirled Peas. If you do not want to use the Peace Turkey, and would prefer to use another familiar, set the `yohohoFamiliar` property to the name of the familiar you would like to use. For example, if you would prefer to use the temporal riftlet for extra adventures, run the following command in the Graphical CLI: `set yohohoFamiliar = temporal riftlet`

If there are other options you'd like to have, please make a GitHub issue. I might add them!

# To-Do List (feel free to PR!!!)
- more intelligent handling of turns spent
- add sneaks task
- figure out if it throws up on unlearned skill passes
- add authority usage
- end of run reporting