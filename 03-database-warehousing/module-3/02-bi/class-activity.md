# Activity: Reading a Dashboard as a Cube

In this activity you will take apart real business intelligence dashboards, find the measures and dimensions behind each one, and work out which OLAP operations it lets you perform. Talk it through with the people around you as you go.

## 1. Pick two or three dashboards

Open Tableau's [Real-World Examples of Business Intelligence (BI) Dashboards](https://www.tableau.com/dashboard/business-intelligence-dashboard-examples). Every dashboard on the page is interactive, so you can click, hover and filter inside it.

Pick two or three that are different from each other, for example one about a business and one that isn't:

- **AAPL Ticker** - Apple's share price over the years, and the events that moved it.
- **Super Sample Superstore** - a retailer's sales, profit and shipping times, with a tab for finding the cause of a change.
- **Healthcare data** - patients in a children's hospital, by department and length of stay.
- **Crimes in India** - crimes by district and type, from 2001 to 2014, on a map.
- **Global Market Overview** - Boeing's forecast of airplane demand over the next 20 years.
- **Race to Alaska** - the routes and speeds of the top five teams in a 750-mile boat race.

## 2. For each dashboard

1. **Find the measures.** Which numbers is the dashboard adding up, counting or averaging? For each one, say why that's the right way to combine it.
2. **Find the dimensions.** What does it break those numbers down by? Look at the axes, the legends, the colours, the filters and the areas on a map. Find the time dimension, and the levels it goes down to - years, months, days or hours.
3. **Describe the cube.** Choose one measure and three of its dimensions, and write the cube down in your notes: the measure, and each dimension with a few of its values. Write one cell in words, the way "Snacks, sold online, in Q3" is one cell of the sales cube. For example:

    ```text
    Measure:     net sales
    Dimension 1: product category  (Bakery, Beverages, Snacks, ...)
    Dimension 2: store             (Bergen, Oslo, Online, ...)
    Dimension 3: quarter           (Q1, Q2, Q3, Q4)
    One cell:    Snacks, sold online, in Q3
    ```
4. **Try each operation.** Click, hover and filter, and note where the dashboard lets you slice, dice, roll up, drill down or pivot. Write down what you did and what changed on the screen. Not every dashboard supports all five, and the ones that are missing are worth noting too.
5. **Name the decision.** Say who would look at this dashboard, and what they would do differently because of it.
6. **Look at one chart.** Say why it suits the data it shows. Why a map, a line or a heat map here, rather than a bar chart?

## 3. Your notes

Keep a short note for each dashboard:

| | |
|---|---|
| **Dashboard** | |
| **Measures** | |
| **Dimensions** | |
| **One cell, in words** | |
| **Operations found, and how** | |
| **Who decides what** | |
| **Chart choice** | |

## Sources

1. Tableau, [Real-World Examples of Business Intelligence (BI) Dashboards](https://www.tableau.com/dashboard/business-intelligence-dashboard-examples)
