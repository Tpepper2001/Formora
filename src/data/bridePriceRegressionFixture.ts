/**
 * Mandatory Regression Test Fixture:
 * "Impact of Girls’ Education on Bride Price Rates"
 * 
 * Contains:
 * - Research Topic & Header
 * - Introduction & Instructions
 * - 5 Sections (A, B, C, D, E)
 * - Exactly 25 numbered respondent questions
 * - Question 5: Fill-in blank text entry
 * - Questions 6 & 12: "Other" write-in options
 * - Question 13: 8 options, multiple-choice ("You may select more than one option")
 * - Questions 15–21: 7 Likert statements in a Markdown table with SA(5), A(4), U(3), D(2), SD(1)
 * - Question 24: 6 options, multiple-choice ("Select all that apply")
 * - Question 25: Long-text qualitative recommendations
 * - Suggested Research Objectives (separate from questions)
 * - Research Note (separate from questions)
 */

export const BRIDE_PRICE_REGRESSION_QUESTIONNAIRE = `# QUESTIONNAIRE
## Research Instrument
**Research Topic: Impact of Girls’ Education on Bride Price Rates**

### Introduction & Instructions
Dear Respondent,
This research instrument is designed to investigate the empirical impact of girls' formal education on bride price rates and marriage expectations. Your objective responses will contribute significantly to academic research and policy formulation. Please read each question carefully and provide honest answers. All information provided will be treated with strict confidentiality and used solely for research purposes.

### SECTION A: DEMOGRAPHIC INFORMATION
1. What is your gender?
- A. Male
- B. Female

2. What is your age bracket?
- A. 18–25 years
- B. 26–35 years
- C. 36–45 years
- D. 46 years and above

3. What is your marital status?
- A. Single
- B. Married
- C. Divorced / Separated
- D. Widowed

4. What is your highest educational qualification attained?
- A. No formal education
- B. Primary school certificate
- C. Secondary school certificate (WAEC/NECO)
- D. Tertiary education (ND/HND/BSc/BA)
- E. Postgraduate degree (MSc/PhD)

5. Community / Local Government Area: ______

6. What is your primary occupation?
- A. Civil Servant / Public Sector
- B. Farming / Agriculture
- C. Trading / Business
- D. Artisan / Craftsman
- E. Other (please specify): ______

### SECTION B: EDUCATIONAL ATTAINMENT AND SOCIAL VALUE
7. Do you believe that educating a girl increases her status within the family and community?
- A. Yes
- B. No
- C. Not sure

8. Who primarily bears the financial cost of a girl's education in your household?
- A. Father
- B. Mother
- C. Both parents equally
- D. Extended family / Guardian
- E. Self-sponsored

9. At what educational level do you consider a woman fully capable of independent livelihood?
- A. Primary education
- B. Secondary education
- C. Tertiary education
- D. Vocational / Technical training

10. Does a woman's level of formal education influence the respect she commands in marriage negotiations?
- A. Very significant influence
- B. Moderate influence
- C. Minimal influence
- D. No influence at all

11. In your community, are educated women expected to marry at an older age compared to uneducated women?
- A. Yes
- B. No
- C. Sometimes / Depends on family

12. What is the most common reason families invest in girls' higher education today?
- A. Career and financial independence
- B. Family prestige and reputation
- C. Better marriage prospects
- D. Ability to support elderly parents
- E. Other (please specify): ______

### SECTION C: TRADITIONAL BRIDE PRICE EXPECTATIONS AND DYNAMICS
13. Which of the following traditional items are typically demanded during marriage negotiations in your locality? (You may select more than one option)
- A. Cash gift / Direct bride price sum
- B. Tubers of yam and foodstuff
- C. Livestock (goats, cows, sheep)
- D. Traditional fabrics and wrappers
- E. Drinks and alcoholic / non-alcoholic beverages
- F. Household utensils and kitchenware
- G. Kola nuts and ceremonial condiments
- H. Monetary levies for youth and elders

14. How would you categorize the financial burden of current bride price rates in your community?
- A. Very expensive
- B. Moderately expensive
- C. Affordable / Fair
- D. Nominal / Symbolic only

### SECTION D: EVALUATION OF EDUCATION ON BRIDE PRICE DETERMINATION
Please indicate your level of agreement with the following statements regarding the relationship between girls' education and bride price rates.

Response Scale:
- Strongly Agree (SA) = 5
- Agree (A) = 4
- Undecided (U) = 3
- Disagree (D) = 2
- Strongly Disagree (SD) = 1

| S/N | Statement | SA | A | U | D | SD |
| --- | --- | --- | --- | --- | --- | --- |
| 15 | Higher educational qualifications justify demanding higher bride price rates from prospective suitors. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 16 | Families expect suitors to reimburse part of the educational expenses incurred on an educated bride. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 17 | Highly educated women face prolonged singlehood due to exorbitant bride price and traditional marital demands. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 18 | Educated brides and their families are more willing to negotiate and accept symbolic bride price tokens. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 19 | Increased earnings and career prospects of an educated woman reduce the family's reliance on high bride price. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 20 | Cultural modernization driven by formal education has diminished the commercialization of bride wealth. | [ ] | [ ] | [ ] | [ ] | [ ] |
| 21 | Bride price is not determined by a woman's education, but strictly by ancient ancestral customs and lineage rites. | [ ] | [ ] | [ ] | [ ] | [ ] |

### SECTION E: POLICY, REFORMS, AND PERCEPTIONS
22. Do you advocate for standardized or pegged bride price rates enforced by community leadership?
- A. Yes, strictly standardized
- B. No, allow families complete discretion
- C. Maintain symbolic cultural token only

23. Should statutory marriage registration supersede traditional bride wealth requirements?
- A. Yes
- B. No
- C. Both should operate concurrently

24. Which interventions can best protect educated young women from exploitative bride price practices? Select all that apply.
- A. Community sensitization and elders' council dialogues
- B. Legislative capping of traditional marriage list items
- C. Youth empowerment and awareness campaigns
- D. Religious institutional guidelines and limits
- E. Abolition of punitive bride wealth demands
- F. Gender equity advocacy and legal protection

25. What personal recommendations or cultural modifications would you propose to ensure marriage practices honor cultural heritage while supporting women's educational and economic empowerment?

### Suggested Research Objectives
- Objective 1: To determine the extent to which girls' formal educational level influences traditional bride price demands.
- Objective 2: To identify the components of marriage lists most affected by the bride's academic achievement.
- Objective 3: To assess whether high bride price expectations contribute to delayed marriage among educated women.
- Objective 4: To propose community-based policy reforms for sustainable and non-commercialized marriage practices.

### Research Note
This questionnaire should be administered to married couples, prospective suitors, community leaders, and family elders. Ensure informed consent is obtained prior to questionnaire administration.
`;
