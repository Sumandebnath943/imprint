import { DEVELOPER_ASSESSMENT_FORMS, DEVELOPER_LEVEL_REASSESSMENTS, DEVELOPER_PRACTICE, developerExerciseBrief } from "../assessment/developer-bank.ts";
import type { RoleTrack } from "../assessment/catalog";

export const ONBOARDING_WORK_VERSION = "onboarding-work-1";

type Choice = { label: string; options: readonly string[]; expected?: string };
type NumberCheck = { label: string; expected: number };
type Workspace = {
  name: string;
  prompt: string;
  fields: readonly string[];
  criteria: readonly [string, string];
  artifact?: "image" | "video" | "audio";
  order?: readonly string[];
  checks?: readonly (Choice | NumberCheck)[];
  code?: boolean;
  simulator?: "booking";
};

const task = (name: string, prompt: string, fields: readonly string[], criteria: Workspace["criteria"], extras: Partial<Workspace> = {}): Workspace =>
  ({ name, prompt, fields, criteria, ...extras });

export const ROLE_WORKSPACES = {
  writer: [
    task("Editorial drafting", "Write a 120–180 word opening for a library newsletter about a new evening reading group. Write for a first-time visitor. The group meets Thursdays at 7 p.m. and welcomes beginners.", ["Intended reader and effect", "Draft"], ["Reader orientation", "Narrative structure"]),
    task("Revision and voice", "Use your previous draft. An editor needs a shorter opening with the invitation and meeting time in the first two sentences. Preserve the welcoming voice.", ["Revised opening", "What changed and why"], ["Brief compliance", "Preservation of meaning and voice"]),
  ],
  journalist: [
    task("Source and claim board", "A council agenda proposes a 20% bus fare rise. A rider says it already applies. The operator's dated notice says fares are unchanged until a vote on Friday. Link each of two claims to the strongest evidence.", ["Claim one and source", "Claim two and source", "Verification step"], ["Claim-to-source traceability", "Conflict verification"], { checks: [{ label: "What is established?", options: ["A change is proposed", "The rise is already in force", "The vote has passed"], expected: "A change is proposed" }] }),
    task("Correction and attribution", "The council publishes minutes showing the increase was deferred. Write a brief with the update and explain which earlier claim needs correction.", ["Brief with attribution", "Correction note"], ["Factual update", "Attribution and uncertainty"]),
  ],
  screenwriter: [
    task("Scene and beat editor", "Write three playable beats for a courier who needs a receptionist to delay closing without revealing that the package is missing.", ["Scene heading and setup", "Action and dialogue", "Turning beat"], ["Playable objective and obstacle", "Causal scene beats"]),
    task("Scene rewrite", "The receptionist already knows the package is missing. Rewrite your scene so the courier changes tactics while still needing the delay.", ["Revised action and dialogue", "Continuity note"], ["Response to changed stakes", "Character and scene continuity"]),
  ],
  marketer: [
    task("Campaign brief builder", "A trial app lets freelance designers record invoices manually. Plan a launch ad for people tracking several clients. Claims about automated imports and guaranteed savings are unsupported.", ["Audience and problem", "Message and call to action", "Channel and rationale"], ["Audience and channel fit", "Support for product claims"]),
    task("Campaign experiment", "Variant A received 80 clicks and 8 trials from 1,000 impressions. B received 50 clicks and 10 trials from 1,000 impressions. The campaign goal is trials, and spend is equal.", ["Decision and interpretation", "Next test and success rule"], ["Interpretation of outcome metrics", "Experiment design"], { checks: [{ label: "Trials per 100 impressions for B", expected: 1 }] }),
  ],
  "customer-support": [
    task("Ticket and policy console", "Ticket T24 reports two card charges. The order log shows one settled charge and one pending hold. Policy says release timing varies and a settled duplicate needs billing review.", ["Customer reply", "Evidence used and next action"], ["Diagnosis from order history", "Policy-aligned resolution"], { checks: [{ label: "Current status", options: ["One charge and one hold", "Two settled charges", "A confirmed refund"], expected: "One charge and one hold" }] }),
    task("Follow-up and handoff", "The customer now supplies a statement with two settled charge IDs. Write the customer update and the internal handoff.", ["Customer update", "Handoff with identifiers and owner"], ["Escalation decision", "Handoff accuracy and acknowledgement"]),
  ],
  sales: [
    task("Discovery conversation", "A buyer wants faster reporting, requires CSV export, and has six weeks to decide. Ask discovery questions before making an offer. The product provides CSV exports and weekly reports.", ["Discovery questions", "Qualification note"], ["Quality of discovery questions", "Evidence of fit and constraints"]),
    task("Objection and follow-through", "The buyer asks for live dashboards, which the product does not provide. Respond and draft the follow-up you would actually send.", ["Objection response", "Follow-up with a next step"], ["Accurate product claims", "Mutual next step and ownership"]),
  ],
  designer: [
    task("Layout canvas", "Design a desktop card for a library event. Use the title, Thursday 7 p.m., and a Register action. Make the action easy to locate.", ["Audience and hierarchy note"], ["Information hierarchy", "Alignment and legibility"], { artifact: "image" }),
    task("Responsive layout revision", "Adapt your first layout to a narrow mobile screen. Keep the title, time, and Register action visible in the first view.", ["Changes and accessibility check"], ["Responsive content fit", "Preservation of hierarchy and legibility"], { artifact: "image" }),
  ],
  illustrator: [
    task("Original illustration", "Draw a monochrome thumbnail of someone hesitating at an open door. Make the gesture readable without a caption. Upload the original image.", ["Intended focal point"], ["Narrative legibility", "Focal clarity and composition"], { artifact: "image" }),
    task("Illustration revision", "Revise the original for a narrow crop. Keep the gesture clear and direct the eye to the character before the door. Upload the revision.", ["What changed and where"], ["Visible improvement in focal clarity", "Story continuity under the crop"], { artifact: "image" }),
  ],
  photographer: [
    task("Contact sheet and crop", "Create or assemble a consented three-frame contact sheet of one everyday object. Mark the lead crop and show why it separates the subject from its background.", ["Lead crop and framing choice"], ["Subject separation", "Framing and curation"], { artifact: "image" }),
    task("Photographic sequence revision", "Reorder or recrop the same three frames for a story about use rather than appearance. Upload the revised contact sheet.", ["What each frame contributes"], ["Sequence and emphasis", "Visual consistency across frames"], { artifact: "image" }),
  ],
  videographer: [
    task("Edit timeline", "Assemble a short edit about opening a workshop. Use an establishing view, a close view of an action, and a result. Add room sound or an intentional silent sequence and upload a short export.", ["Shot list and timecodes", "Audio decision"], ["Edit continuity evidenced by the timeline", "Audio intention and placement"], { artifact: "video", order: ["Detail of the action", "Wide workshop view", "Result reveal"] }),
    task("Vertical recut", "Recut your edit to at most 20 seconds in a vertical frame. Log the dropped material and where the important action lands in the new crop.", ["New timecodes and frame choices", "Story continuity note"], ["Runtime and crop planning", "Preservation of story and action"], { artifact: "video" }),
  ],
  architect: [
    task("Scaled layout sketch", "Sketch a zoning layout for an 8 m × 6 m study room with an entry, quiet study, service desk, and circulation. Label dimensions. The fictional brief needs a clear 1.5 m circulation route.", ["Scale and circulation explanation"], ["Adjacency and circulation", "Consistency of labeled dimensions"], { artifact: "image" }),
    task("Footprint adaptation", "The entrance moves to the opposite short side. Revise the schematic and show where the 1.5 m route and each zone fit.", ["Dimensional check and tradeoff"], ["Response to changed entry", "Preservation of exercise clearances"], { artifact: "image" }),
  ],
  musician: [
    task("Motif score", "Notate four 4/4 bars with a two-note motif, one rhythm variation, and a clear ending. Upload labeled notation or capture it in the beat grid.", ["Beat grid or notation description", "Motif and variation"], ["Rhythmic consistency", "Recognizable motif and variation"]),
    task("Variation and transposition", "Transpose your motif up two semitones while preserving its rhythm, then narrow the ending's range. Log the pitches and beat positions.", ["Revised beat and pitch grid", "Where the motif is preserved"], ["Pitch transformation", "Preservation of phrase identity"], { checks: [{ label: "If the original pitch is MIDI 60, what is the transposed pitch?", expected: 62 }] }),
  ],
  performer: [
    task("Performance cue sheet", "Plan and upload a short opening introducing a community performance. Mark the opening cue, audience instruction, and transition with timestamps.", ["Cue and timecode list", "Audience intention"], ["Observable cue sequence", "Purposeful audience orientation"], { artifact: "video" }),
    task("Changed-cue take", "Repeat the opening as if the first sound cue is delayed. Record your adjusted take and annotate where you recovered the transition.", ["Recovery timestamp and choice"], ["Reaction to delayed cue", "Continuity into the next moment"], { artifact: "video" }),
  ],
  actor: [
    task("Script beats and first take", "Record a short fictional scene where a character needs a friend to stay without revealing a surprise. Annotate the objective and where the tactic changes.", ["Objective and beat timecodes"], ["Specificity of playable choices", "Coherence of objective and beat change"], { artifact: "video" }),
    task("Direction-note retake", "Repeat the scene assuming the friend has already guessed the surprise. Mark where the new direction changes a visible or audible choice.", ["Retake timecode and changed tactic"], ["Specific response to the direction", "Consistency of the revised tactic"], { artifact: "video" }),
  ],
  chef: [
    task("Service station board", "Plan eight servings of a warm grain bowl in 35 minutes using one oven. The supplied station rules require separate utensils for a sesame-free serving.", ["Station plan with times", "Segregation and handoff note"], ["Feasible critical path", "Adherence to supplied allergen rules"], { order: ["Plate", "Wash and prep produce", "Start longest cook", "Set separate utensils"] }),
    task("Service recovery", "The oven becomes unavailable halfway through the service plan. Two burners remain. Replan the remaining steps and preserve the sesame-free serving.", ["Revised station schedule", "Quality tradeoff and allergen check"], ["Service timing recovery", "Continuity of allergen separation"]),
  ],
  "software-developer": [
    task("Diagnosis and isolated code editor", "Diagnose the defect in the starter project, then patch the files. Keep the exported interface and run the example checks in the isolated workspace.", ["Diagnosis and patch rationale"], ["Behavior under the stated requirements", "Maintainability of the patch"], { code: true }),
    task("Verification and edge cases", "Use the same patch. Predict empty, mixed, and defect-revealing inputs. Run the tests and explain any mismatch between expected and observed behavior.", ["Inputs and expected results", "Observed outcomes and remaining risk"], ["Defect-revealing test coverage", "Interpretation of actual outcomes"]),
  ],
  "software-qa": [
    task("Test matrix and booking simulator", "The mock booking form accepts 1–6 guests. Test create and edit. Use the supplied form to compare expected and observed behavior, including boundary cases.", ["Test matrix with expected and observed results", "Risk priority"], ["Boundary and workflow coverage", "Quality of expected outcomes"], { simulator: "booking" }),
    task("Defect report and fix verification", "Use the same booking simulator. Reproduce the fault, then select the candidate fix and repeat the failing and neighboring tests.", ["Steps, expected and actual results", "Severity and regression results"], ["Reproducibility and impact", "Verification of the fix and neighboring cases"], { simulator: "booking" }),
  ],
  "data-scientist": [
    task("Dataset and analysis workspace", "A fictional shipment table contains dispatch time, warehouse, weather forecast, and delay resolution. Define a model predicting delays before dispatch and plan a reproducible analysis.", ["Target, split, and eligible fields", "Notebook steps or query"], ["Leakage control and evaluation design", "Reproducibility of the pipeline"], { checks: [{ label: "Which field is available only after the outcome?", options: ["Warehouse", "Weather forecast", "Delay resolution"], expected: "Delay resolution" }] }),
    task("Held-out model evaluation", "On 100 held-out shipments, 15 were late. The model flagged 30 and caught 12 late shipments. Record recall and choose a useful slice to investigate.", ["Slice and uncertainty", "Limits of the conclusion"], ["Metric interpretation and error analysis", "Appropriate uncertainty and limitations"], { checks: [{ label: "Recall as a percentage", expected: 80 }] }),
  ],
  researcher: [
    task("Study design board", "Design a small study of whether a checklist changes completion of a fictional tutorial. Participants normally choose whether to use a checklist.", ["Research question and outcome", "Allocation, sample, and confounds"], ["Question-to-design alignment", "Identification and control of confounds"]),
    task("Evidence and interpretation board", "A voluntary checklist group completed 22 of 30 tasks, and a comparison group completed 18 of 30. The checklist group had more prior experience.", ["Claim supported by the data", "Alternative and next check"], ["Traceability to observed results", "Limits on causal inference"], { checks: [{ label: "Difference in completed tasks", expected: 4 }] }),
  ],
  scientist: [
    task("Virtual experiment planner", "Use a toy-car simulation to test whether surface texture changes stopping distance. Choose the measured outcome, variables, and repeats.", ["Comparison and held-constant variables", "Repeated measurement plan"], ["Isolation of the independent variable", "Control and measurement quality"]),
    task("Anomaly and uncertainty lab", "The simulator returned 4, 4, 5, and 11 units on one surface and 5, 5, 4, and 5 on the other. One run may have started from a different mark.", ["Anomaly and possible explanations", "Discriminating next test"], ["Interpretation of variability", "Test that separates alternative explanations"]),
  ],
  accountant: [
    task("Ledger reconciliation", "A fictional ledger began at 900, then recorded a 140 deposit and 80 of expenses. The bank ends at 985. The bank shows a 15 fee absent from the ledger; a 40 deposit is in transit.", ["Timing items and reconciliation steps"], ["Arithmetic and matching", "Distinction between timing items and adjustments"], { checks: [{ label: "Adjusted ledger balance", expected: 945 }] }),
    task("Period-end audit note", "Draft a reconciliation handoff. Identify which adjustment the supplied bank statement supports and what additional evidence is needed for the remaining discrepancy.", ["Proposed supported adjustment", "Open discrepancy and source request"], ["Support for classification", "Audit trail and handoff completeness"]),
  ],
  educator: [
    task("Teacher or lecturer studio", "Choose Teacher for a pupil who thinks 1/8 is larger than 1/4. Choose Lecturer for a group confusing the average and median in a skewed dataset. Show the misconception, representation, and explanation you would use.", ["Misconception and explanation", "Representation or slide sequence"], ["Diagnosis and accuracy", "Sequencing for the chosen learners"], { checks: [{ label: "Teaching setting", options: ["Teacher", "Lecturer"] }] }),
    task("Learner response and adaptation", "Use the same setting. The learner repeats your rule but gives the wrong answer on a fresh example. Write a transfer check and adapt your explanation using their response.", ["Transfer question and expected answer", "Likely misconception and adaptation"], ["Check for transfer", "Adaptation based on learner evidence"]),
  ],
  doctor: [
    task("Fictional case chart and explanation", "A simulated patient has contradictory appointment times. The supplied case rule says reception confirms the correct appointment. Prepare an explanation and a structured handoff.", ["Known facts and uncertainty", "Explanation and handoff"], ["Separation of chart facts and unknowns", "Clarity of explanation and teach-back"]),
    task("Changed finding and handoff", "The simulated patient now reports an alert on the check-in screen. The exercise rule is to alert the designated supervisor and let reception handle time verification.", ["Updated priority and why", "Handoff and remaining questions"], ["Recognition of the changed priority", "Escalation consistent with supplied instructions"]),
  ],
  lawyer: [
    task("Issue and authority map", "In a fictional file, Rule A requires notice within 10 days of shipment; Rule B starts the clock at delivery for damaged orders. Shipment was May 1 and delivery May 6. The complaint says the package arrived damaged.", ["Issue and relevant supplied rule", "Known and disputed facts"], ["Issue-to-authority mapping", "Clear treatment of disputed facts"]),
    task("Changed fact and contrary authority", "The carrier disputes damage at delivery and supplies a photograph. Outline each supportable position using the exercise rules and identify the missing evidence.", ["Revised argument and counterargument", "Risk and evidence request"], ["Response to contrary evidence", "Accuracy about limits and remaining risk"]),
  ],
  therapist: [
    task("Fictional dialogue simulator", "A simulated person says they volunteered for a project and now feel torn about going. Write a short reflective response and an open question.", ["Reflection", "Open question and boundary"], ["Reflective listening grounded in the dialogue", "Open inquiry and boundaries"]),
    task("Respond to a rupture", "The simulated person says, 'That sounds like you think I should go.' Acknowledge the rupture, check your understanding, and follow the supplied scenario instruction to seek supervision if concern remains.", ["Acknowledgement and check", "Boundary and next step"], ["Repair without imposing a motive", "Appropriate boundaries and follow-up"]),
  ],
  "social-worker": [
    task("Needs and referrals map", "In a fictional case, a client asks for weekday transport and prefers an evening appointment. Route A requires residency proof and closes at 4. Route B accepts walk-ins until 7 but covers a limited area.", ["Needs, priorities and client preference", "Eligibility and referral map"], ["Inclusion of client preference", "Referral eligibility and feasibility"]),
    task("Resource change and continuity", "Route B is temporarily unavailable. Prepare a revised referral and handoff, preserving client choice and identifying what still needs checking.", ["Revised options and consent", "Handoff owner and follow-up"], ["Feasible revised referral", "Safeguarding and continuity"]),
  ],
  "product-manager": [
    task("Backlog prioritization board", "Support requests favor CSV exports; prospective users ask for onboarding help. You have one sprint. Export takes eight days, onboarding tips four, and instrumentation three.", ["Prioritization rationale", "User evidence and success metric"], ["Problem framing from user evidence", "Feasibility and outcome selection"], { order: ["Onboarding tips", "CSV export", "Instrumentation"] }),
    task("Capacity change and decision log", "Engineering capacity falls to six days, and abandonment is confirmed as the top issue. Reorder the backlog and explain how you will test the decision.", ["New priorities and deferred work", "Outcome check and owner"], ["Adaptation to evidence and constraints", "Testable success criteria"], { order: ["Onboarding tips", "CSV export", "Instrumentation"] }),
  ],
  entrepreneur: [
    task("Unit economics sheet", "A pilot product costs 15 per fulfilled order, sells for 30, and has 300 in fixed launch costs. Estimate margin and give one assumption to test.", ["Price and demand assumption", "Cost and break-even reasoning"], ["Coherence of commercial assumptions", "Correct interpretation of unit economics"], { checks: [{ label: "Break-even units at stated cost and price", expected: 20 }] }),
    task("Experiment and runway", "A channel raises variable cost to 22. Choose a small experiment and decide the evidence that would support continuing. Your experiment budget is 120.", ["Experiment and budget allocation", "Success and stop rules"], ["Testability of the experiment", "Impact on margin and runway"]),
  ],
  executive: [
    task("Resource and accountability board", "Allocate six people among reliability, customer onboarding, and a reporting deadline. Reliability needs two for minimum coverage and reporting needs one.", ["Allocations and tradeoffs", "Owner and risk review"], ["Feasible allocation under minimums", "Explicit risk and accountability"]),
    task("Decision under a changed mandate", "A customer deadline moves forward by a week. Revise your allocation and draft the delegation and escalation message.", ["Revised allocation and rationale", "Delegation and escalation message"], ["Stakeholder tradeoff handling", "Clarity of ownership and escalation"]),
  ],
  athlete: [
    task("Play annotation board", "In a fictional possession, a defender closes the inside passing lane at second 2 while a teammate becomes free outside at second 3. Annotate the sequence and decide when and where to move the ball.", ["Cue and timestamp", "Selected action and reason"], ["Recognition of relevant cues", "Action fits the observed play"], { order: ["Teammate free outside", "Defender closes the lane", "Pass selection"] }),
    task("Tactical adaptation", "The outside teammate is now covered at second 3, but support arrives behind. Update your plan and define what you would watch to verify it.", ["Adapted decision and cue", "Verifiable outcome"], ["Adaptation to changed space", "Observable success definition"]),
  ],
  coach: [
    task("Observation and correction board", "A provided play log shows the athlete looks up only after the ball arrives on two of three possessions. Identify the observation you would share and one correction to try.", ["Evidence from the play log", "Specific coaching cue"], ["Accuracy of observation", "Specificity and actionability of feedback"]),
    task("Drill and progression", "Design a drill to practice the cue. The athlete executes it unopposed but misses it under pressure. Adjust the next progression and define a measurable success check.", ["Initial drill and progression", "Adjustment and success check"], ["Match of drill to observed issue", "Progression and measurable success"]),
  ],
  student: [
    task("Worked solution workspace", "A supplied lesson says equal shares are found by dividing the total by the number of recipients. Work through sharing 75 items among five people and show the meaning of your answer.", ["Worked reasoning or concept map"], ["Understanding of equal share", "Traceable reasoning steps"], { checks: [{ label: "Items per person", expected: 15 }] }),
    task("Transfer and correction", "A classmate says 78 items shared among six people gives 12 each. Use the lesson to check and correct the claim.", ["Why the original answer fails", "Check for the corrected answer"], ["Transfer to a fresh example", "Explanation of the correction"], { checks: [{ label: "Correct items per person", expected: 13 }] }),
  ],
  "homemaker-parent": [
    task("Schedule and budget planner", "Plan a fictional weekday with a 9 a.m. appointment, 30 minutes of travel each way, and chores before noon. The supply budget is 40. Choose your own priorities.", ["Timed plan", "Budget and priorities"], ["Conflict and dependency handling", "Feasibility under stated priorities"]),
    task("Contingency planner", "The appointment starts 45 minutes late and the supply budget falls by 10. Replan without losing your most important commitment.", ["Updated schedule and cost", "What moved and why"], ["Feasibility of revised dependencies", "Protection of user-chosen priorities"]),
  ],
  retired: [
    task("Project milestone planner", "Choose a learning or community project that can make progress in four weeks with two hours each week. Define what an observable milestone would look like.", ["Goal and milestone", "Resources and weekly plan"], ["Scope appropriate to the chosen goal", "Concrete milestones and resource use"]),
    task("Progress and adaptation log", "A week becomes unavailable. Revise the milestone plan and provide one concrete example or artifact description showing progress you could record.", ["Revised sequence", "Evidence of progress"], ["Feasible adaptation", "Evidence linked to the chosen milestone"]),
  ],
  "between-jobs": [
    task("Skills-to-vacancy evidence map", "A fictional project coordinator vacancy asks for schedule planning, team updates, and issue tracking. Map two examples from work, volunteering, or study to the requirements.", ["Requirement and evidence one", "Requirement and evidence two", "Unmet requirement and next step"], ["Relevance of the evidence", "Traceability and honest gap identification"]),
    task("Interview and follow-through", "The interviewer asks about one missed deadline. Prepare a concrete response and a revised search action based on the gap you identified.", ["Interview response and result", "Next search action and evidence"], ["Specificity of transferable experience", "Feasibility of follow-through"]),
  ],
  freelancer: [
    task("Scope and estimate sheet", "A client requests a landing page, two review rounds, and handover in 10 working days. Estimate hours and cost using an hourly rate of 50.", ["Deliverables and effort", "Price, dependencies, and assumptions"], ["Completeness of scope and dependencies", "Defensible estimate"]),
    task("Change request and acceptance", "The client adds a second page and wants the same deadline. Write a revised quote with the effect on commitments and clear acceptance conditions.", ["Updated price and schedule", "Acceptance criteria and tradeoff"], ["Impact on cost and commitments", "Clear and testable acceptance criteria"]),
  ],
} satisfies Record<string, [Workspace, Workspace]>;

const ALTERNATE_CONDITIONS: Record<keyof typeof ROLE_WORKSPACES, readonly [string, string]> = {
  writer: ["Write for a parent accompanying a new reader. Give them a concrete sense of what happens on arrival.", "Keep the first two sentences and add an invitation that reassures a reader joining mid-series."],
  journalist: ["A screenshot also circulates with the same fare figure and no date. Decide how it changes your sourcing plan.", "The minutes now include a new review date without a vote date. Make that distinction in the update."],
  screenwriter: ["Make the delay request through a prop and one interrupted line rather than an explicit explanation.", "The receptionist removes the prop. Build a different action that preserves the turning beat."],
  marketer: ["The campaign is also restricted to a single visual and a mobile audience. Use the same supplied product claims.", "The expensive choice is the next test. Specify one variable to isolate and what outcome would justify rerunning it."],
  "customer-support": ["The customer needs to know which order appears on the statement. Include the clarification you would ask for.", "The billing team is offline until morning. Provide an ownership and follow-up expectation supported by the policy."],
  sales: ["The buyer's finance partner attends the meeting and wants a measurable success criterion.", "The buyer has a backup vendor meeting tomorrow. Propose a concrete low-cost next step with an acknowledgement of the missing feature."],
  designer: ["The same card must work in monochrome. Use the same title, time, and action.", "In the mobile layout, the title wraps onto two lines. Show how you preserve focus and avoid overflow."],
  illustrator: ["Stage the doorway from a low viewpoint and keep the gesture legible with three value groups.", "Keep the narrow crop and use negative space to make the hesitation legible."],
  photographer: ["Select your three frames using a single light source and include one frame with foreground occlusion.", "Make the middle image connect an exterior view with a detail. Explain why the transition reads."],
  videographer: ["Plan the edit to communicate the action with the sound turned off.", "Use a hard 15-second limit and ensure the result remains visible long enough to read."],
  architect: ["The fictional layout also needs a direct line of sight from service desk to entrance.", "Maintain both line of sight and the accessible circulation route under the new entry."],
  musician: ["Make the third bar a rhythm echo rather than an exact repetition.", "Preserve the two-semitone transposition while making one note in the ending longer."],
  performer: ["Open for an audience that is already moving through the room.", "Recover the delayed cue without repeating the opening and mark where the transition resumes."],
  actor: ["Give the character a visible task that they perform while trying to keep the friend in the room.", "Let the friend interrupt that task. Mark how the character finds a new tactic."],
  chef: ["You have one shared chopping surface. Include the cleaning or separation handoff in your sequence.", "One of the two burners must remain free for the separate serving. Show how the amended schedule handles it."],
  "software-developer": ["Use the next starter project in the Basic series.", "Explain the evidence from the next starter project's actual checks."],
  "software-qa": ["Add a same-value edit of an existing booking. Distinguish the saved record from the displayed entry.", "Verify that the candidate still permits valid edits and preserves the old booking after a rejected edit."],
  "data-scientist": ["A warehouse appears in the holdout but was absent from training. Decide how to account for it.", "A low-volume warehouse shows most of the false positives. Explain how you would handle small-sample uncertainty."],
  researcher: ["The checklist can be shared across teams. Decide whether to allocate by person or team and how to measure spillover.", "The prior experience finding comes from an incomplete survey. Explain what a follow-up would need to measure."],
  scientist: ["The simulated release mechanism can vary by operator. Control or block that source of variation.", "A second trial using a fixed release mark is available. Specify the comparison that would distinguish release error from surface effects."],
  accountant: ["The closing note also uses the bank balance before deposits in transit. Label precisely which balance you start each calculation from.", "A copy of the fee memo is unsigned. Distinguish confirming the fact of a fee from the authorization to post it."],
  educator: ["Use a contrasting example and explain the likely wrong answer in the teaching setting selected.", "Revise for a learner who gets the calculation right but gives the wrong explanation."],
  doctor: ["The fictional patient has two phone numbers. The chart treats the preferred number as unverified. Include that uncertainty in the handoff.", "The designated supervisor is temporarily away. The supplied exercise rule is to notify the named backup supervisor."],
  lawyer: ["Add an email quoting Rule A without mentioning Rule B. Mark the email as evidence of what was said and distinguish it from authority.", "The photograph has no timestamp. Explain how that changes the weight it can carry in the fictional dispute."],
  therapist: ["The simulated person gives a long pause before answering. Show how you would leave room for their response.", "They now ask whether you can promise an outcome. Use the supplied supervision instruction and maintain a clear boundary."],
  "social-worker": ["The fictional client also asks who can see their referrals. Include a decision about consent and follow-up.", "The remaining option can only call during working hours. Plan a contact route the client can actually use."],
  "product-manager": ["The export requests are from three repeat callers. Explain the relative weight you give this evidence.", "Instrumentation can only observe the first session. Define an outcome that the available measurement can support."],
  entrepreneur: ["A delivery delay introduces a risk of refunds. Label what the break-even calculation assumes about refunds.", "The channel offers a one-week trial at the higher variable cost. Decide what result would justify expanding it."],
  executive: ["Two of the allotted people have the specialist skills needed for reporting. Make that dependency visible.", "The specialist becomes temporarily unavailable. Assign a backup owner and specify the escalation threshold."],
  athlete: ["The defender shifts early but the outside teammate is a step late. Mark which cue you would use to time the decision.", "Support behind is approaching at an angle. Identify a cue that would make you hold rather than release immediately."],
  coach: ["The log now identifies the direction of pressure on each possession. Distinguish which part of the observation matters for the cue.", "The athlete is successful when pressure comes from one side. Add a progression that checks transfer from the other side."],
  student: ["Explain how you could check the equal-share answer by multiplication using a simple diagram or equation.", "Explain how the classmate could have caught the error before doing the whole calculation."],
  "homemaker-parent": ["The weekday also has a 30-minute remote call. Keep it off the travel window.", "The call cannot move. Explain which optional commitment you defer."],
  retired: ["One resource is available only in week two. Make its timing explicit in the milestone plan.", "The unavailable week overlaps the resource. Show a useful revised milestone that fits the resources left."],
  "between-jobs": ["One example must come from a setting outside paid employment. Explain how it transfers to the role.", "The example was a group effort. Be explicit about what you personally contributed and what you would do next."],
  freelancer: ["The second review round depends on the client delivering photos by day five. Show how the estimate handles that dependency.", "The extra page can launch later if agreed. Compare an in-scope phased delivery with the revised full quote."],
};

export function getOnboardingWorkspace(roleId: string, question: number, form = 0): Workspace | undefined {
  const pair = (ROLE_WORKSPACES as Record<string, [Workspace, Workspace]>)[roleId];
  if (!pair || (question !== 5 && question !== 6)) return undefined;
  const workspace = pair[question - 5];
  if (!form || roleId === "software-developer") return workspace;
  return { ...workspace, prompt: `${workspace.prompt}\n\n${ALTERNATE_CONDITIONS[roleId as keyof typeof ROLE_WORKSPACES][question - 5]}` };
}

export function workspaceRole(role: RoleTrack): RoleTrack {
  const tasks = role.tasks.map((task, index) => {
    const workspace = getOnboardingWorkspace(role.id, index + 5);
    return workspace ? { ...task, skill: workspace.criteria[0], evidence: workspace.criteria.join(" and "),
      mode: workspace.artifact === "image" ? "image" : "text", prompt: workspace.name, practice: workspace.prompt } : task;
  }) as RoleTrack["tasks"];
  return { ...role, version: ONBOARDING_WORK_VERSION, tasks };
}

export function getWorkspaceExercise(form: number, level: string) {
  const alternate = form > 0 && DEVELOPER_LEVEL_REASSESSMENTS.find((exercise) => exercise.difficulty === level);
  if (alternate) return developerExerciseBrief(alternate);
  return DEVELOPER_PRACTICE.find((exercise) => exercise.difficulty === level && level !== "Basic") ??
    developerExerciseBrief(DEVELOPER_ASSESSMENT_FORMS[form % DEVELOPER_ASSESSMENT_FORMS.length]);
}

export function finalWorkspaceForm(roleId: string, difficulty: string) {
  return roleId === "software-developer" && difficulty === "Basic" ? 3 : 1;
}
