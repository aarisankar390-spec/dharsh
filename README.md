# AI Bachelor Room Cooking & Chore Manager

A fully software-based web app for four roommates to fairly distribute cooking and household tasks across Breakfast, Lunch and Dinner.

## Default members
- DHARSHINI
- SUBETHA
- JANA
- MADHU

## Default workload rules
- Groceries: 10% (1 person)
- Vegetable Cutting: 15% (1 person)
- Cooking: 40% total (2 people => 20% each)
- Vessel Washing: 15% (1 person)
- Cleaning House: 30% total (2 people => 15% each)

The app internally normalizes the individual slot weights so that all assigned workload percentages form a 100% comparison. It also checks the day's previous meal assignments and tries different rotations to minimize workload variance and avoid repetitive task assignment.

## Features
- Select Breakfast / Lunch / Dinner separately
- Assign tasks using the AI fairness engine
- Default four members already loaded
- Add additional members
- Add custom tasks and weights
- Two-person tasks supported
- Mark tasks completed / pending
- Shared database state; all connected browsers see updates through polling
- Daily fairness summary
- Responsive laptop/mobile UI

## Run in VS Code
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Open Terminal.
4. Run:

```bash
npm install
npm start
```

5. Open **http://localhost:3000** in your browser.
6. To test shared updates, open the same URL in two browser windows/devices connected to the same machine/network. For another device use the host computer's local IP, e.g. `http://192.168.x.x:3000` and allow Node through the firewall if asked.

## Important
This is a deterministic AI-style fairness engine, not a trained ML model. For a college prototype, this is useful because the allocation is explainable and reproducible. A future version can replace/augment the engine with an LLM or ML model.
