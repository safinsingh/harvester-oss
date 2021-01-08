# Harvester

**NOTE**: the production code behind this repo has been made private so as not to leak any personal data pertaining to players.

This is a Discord bot meant to play along with Maple. It will

- Keep track of and replicate Maple's state internally
- Automatically harvest when you can and the clock is above a certain threshold
- Automatically snipe someone who's typing if both you and them can harvest (NOTE: this is inherently slow & unreliable becase of Discord's API)
- Cache state between separate runs
- Verbosely log & dump app state

## How does it work?

When Harvester first starts up, it's state is instatiated based on the presence of a cache file. If it's not present, it will send messages in the appropriate Maple channel and grab the cooldown times of each person. Once this is done, it'll go in to what I call the `initializeHarvestTimeCycle`. This will essentially update the state every second, decrement people's cooldowns, and increment the clock. Then, it sets up a `message` and `typingStart` event listener. If it recieves a valid `harvest` (the validity is evaluated by checking Maple's response against a regular expression), it will reset the respective player's cooldown and reset the clock. When a user is typing, it will check if:

1. The user who is typing has no cooldown
2. You have no cooldown left
3. The clock is over some threshold (typically, this is set to less than whatever the normal threshold is to be toxic)
4. Snipe!

Finally, Harvester's cache is implemented by running a function to persist the app state to disk by listening for SIGINT, SIGTERM, and SIGQUIT (thanks node!). All cache data should be considered volatile, however, because it doesn't keep track of possible harvests (which reset the clock & cooldown). Make sure to keep track of these manually, and try to keep downtime to a minimum. Remember that you can redo the full initialization whenever you want by deleting the cache. Additionally, I found a little bug (or limitation, I guess) of harvester, which allows immediately sequential harvest requests to be registered as the same request each time (without resetting timeout & clock) assuming you do it fast enough. Because `snipe()` is asynchronous, you can just `await Promise.all([])` on `snipe()` and send all of them at the same time. **NOTE**: the developer has been made aware of this bug.
