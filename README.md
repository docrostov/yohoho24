# yohoho24
Simplistic Crimbo automation script for 2024 Holiday Season. Made to work for people who are me. Loathers are welcome to take this to the group.

# Installation
To install, run:

`git checkout docrostov/yohoho24 main`

Then, create a new autoattack with the following macro and set it to fire. This is in-game. Use the relay browser.

```
pickpocket
attack

if hasskill Bowl Sideways 
    skill bowl sideways
endif

# jurassic parka YR 
if hasskill 7423
    skill 7423
endif

# dart freekill
if hasskill 7521
    skill 7521
endif

# jokester freekill
if hasskill 7265
skill 7265
endif

# shatterpunch
if hasskill 0149
skill 0149
endif

# xray
if hasskill 7307
skill 7307
endif

# gingerhit
if hasskill 163
skill 163
endif

# swoop like a bat for pp
if hasskill 7530
    skill 7530
endif

if hascombatitem shadow brick
    use shadow brick
endif

# easter island
if snarfblat 588
    skill saucegeyser
    skill saucegeyser
    skill saucegeyser
endif
# patrick island
if snarfblat 589
    skill saucegeyser
    skill saucegeyser
    skill saucegeyser
endif
```

# Usage
Run `yoho help` for a rundown on the commands.

# To-Do List (feel free to PR!!!)
- get the macro submitted for the user
- more intelligent handling of turns spent
- autumnaton usage (just going to send it to the zone you're in)
- set up eagle res (outskirts)
- add sneaks task
- add spell damage carol
- figure out if it throws up on unlearned skill passes
- add authority usage
- parka mode toggling
- end of run reporting