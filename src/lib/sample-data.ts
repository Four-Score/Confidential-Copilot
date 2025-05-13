export const templates = [
  {
    id: "business-proposal",
    name: "Business Proposal",
    description: "A professional template for business proposals",
    preview: `
      <h1>Business Proposal</h1>
      <h2>Executive Summary</h2>
      <p>This proposal outlines our approach to helping your business achieve its goals through strategic implementation of our services.</p>
      <h2>Problem Statement</h2>
      <p>Your company is facing challenges in [specific area]. This is impacting your ability to [specific impact].</p>
      <h2>Proposed Solution</h2>
      <p>We propose implementing [solution] which will address these challenges by [benefits].</p>
    `,
    sampleContent: `
      <h1>Business Proposal</h1>
      <h2>Executive Summary</h2>
      <p>This proposal outlines our approach to helping your business achieve its goals through strategic implementation of our services.</p>
      
      <h2>Problem Statement</h2>
      <p>Your company is facing challenges in scaling operations while maintaining quality. This is impacting your ability to meet growing customer demand and capitalize on market opportunities.</p>
      
      <h2>Proposed Solution</h2>
      <p>We propose implementing an integrated workflow management system which will address these challenges by automating routine tasks, improving communication between departments, and providing real-time analytics for decision making.</p>
      
      <h2>Implementation Plan</h2>
      <p>Our implementation will follow these key phases:</p>
      <ol>
        <li>Discovery and Analysis (2 weeks)</li>
        <li>System Configuration (3 weeks)</li>
        <li>Training and Onboarding (2 weeks)</li>
        <li>Go-Live and Support (ongoing)</li>
      </ol>
      
      <h2>Investment</h2>
      <p>The total investment for this solution is $XX,XXX, which includes:</p>
      <ul>
        <li>Software licensing</li>
        <li>Implementation services</li>
        <li>Training and documentation</li>
        <li>3 months of premium support</li>
      </ul>
      
      <h2>Expected ROI</h2>
      <p>Based on our experience with similar clients, you can expect:</p>
      <ul>
        <li>30% reduction in administrative overhead</li>
        <li>25% improvement in project delivery times</li>
        <li>15% increase in customer satisfaction</li>
      </ul>
      
      <h2>Next Steps</h2>
      <p>To proceed with this proposal, we recommend scheduling a detailed planning session with your key stakeholders. We're available to begin work within two weeks of approval.</p>
    `,
  },
  {
    id: "srs-document",
    name: "Software Requirements Specification",
    description: "A detailed template for software requirements",
    preview: `
      <h1>Software Requirements Specification</h1>
      <h2>1. Introduction</h2>
      <p>1.1 Purpose</p>
      <p>1.2 Scope</p>
      <p>1.3 Definitions</p>
      <h2>2. Overall Description</h2>
      <p>2.1 Product Perspective</p>
      <p>2.2 User Classes and Characteristics</p>
      <h2>3. Specific Requirements</h2>
      <p>3.1 Functional Requirements</p>
      <p>3.2 Non-Functional Requirements</p>
    `,
    sampleContent: `
      <h1>Software Requirements Specification</h1>
      
      <h2>1. Introduction</h2>
      <h3>1.1 Purpose</h3>
      <p>This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the [Product Name]. It is intended to be used by the development team to implement the software system.</p>
      
      <h3>1.2 Scope</h3>
      <p>The [Product Name] will be a web-based application that allows users to [primary functionality]. The system will provide features for [key feature areas].</p>
      
      <h3>1.3 Definitions, Acronyms, and Abbreviations</h3>
      <ul>
        <li>SRS - Software Requirements Specification</li>
        <li>UI - User Interface</li>
        <li>API - Application Programming Interface</li>
      </ul>
      
      <h2>2. Overall Description</h2>
      <h3>2.1 Product Perspective</h3>
      <p>The [Product Name] is a [new/replacement] system that will [integrate with/replace] the existing [related systems]. It will interface with [external systems] through [interface methods].</p>
      
      <h3>2.2 User Classes and Characteristics</h3>
      <p>The system will support the following user types:</p>
      <ul>
        <li>Administrators - Responsible for system configuration and user management</li>
        <li>Regular Users - Primary users who will [main user activities]</li>
        <li>Guest Users - Limited access users who can [limited functionality]</li>
      </ul>
      
      <h2>3. Specific Requirements</h2>
      <h3>3.1 Functional Requirements</h3>
      
      <h4>3.1.1 User Authentication</h4>
      <ul>
        <li>The system shall allow users to register with email and password</li>
        <li>The system shall support social login via Google and Facebook</li>
        <li>The system shall implement password reset functionality</li>
      </ul>
      
      <h4>3.1.2 User Profile Management</h4>
      <ul>
        <li>Users shall be able to view and edit their profile information</li>
        <li>Users shall be able to upload a profile picture</li>
        <li>Users shall be able to manage notification preferences</li>
      </ul>
      
      <h3>3.2 Non-Functional Requirements</h3>
      
      <h4>3.2.1 Performance</h4>
      <ul>
        <li>The system shall support at least 1000 concurrent users</li>
        <li>Page load time shall not exceed 2 seconds under normal conditions</li>
        <li>API response time shall not exceed 500ms for 95% of requests</li>
      </ul>
      
      <h4>3.2.2 Security</h4>
      <ul>
        <li>All communications shall be encrypted using TLS 1.2 or higher</li>
        <li>User passwords shall be stored using bcrypt with appropriate salt</li>
        <li>The system shall implement rate limiting to prevent brute force attacks</li>
      </ul>
    `,
  },
  {
    id: "marketing-plan",
    name: "Marketing Plan",
    description: "A comprehensive marketing plan template",
    preview: `
      <h1>Marketing Plan</h1>
      <h2>Executive Summary</h2>
      <p>This marketing plan outlines our strategy for [product/service] over the next [timeframe].</p>
      <h2>Market Analysis</h2>
      <p>Current market conditions and competitive landscape.</p>
      <h2>Target Audience</h2>
      <p>Detailed description of our primary and secondary target markets.</p>
    `,
    sampleContent: `
      <h1>Marketing Plan</h1>
      
      <h2>Executive Summary</h2>
      <p>This marketing plan outlines our strategy for [Product/Service] over the next 12 months. Our goal is to increase market share by 15% and generate $X million in revenue through targeted digital marketing campaigns, strategic partnerships, and enhanced customer engagement initiatives.</p>
      
      <h2>Market Analysis</h2>
      <h3>Industry Overview</h3>
      <p>The [industry] is currently valued at $X billion and is projected to grow at X% annually over the next five years. Key trends include [trend 1], [trend 2], and [trend 3].</p>
      
      <h3>Competitive Analysis</h3>
      <table border="1" cellpadding="5">
        <tr>
          <th>Competitor</th>
          <th>Market Share</th>
          <th>Key Strengths</th>
          <th>Key Weaknesses</th>
        </tr>
        <tr>
          <td>Competitor A</td>
          <td>35%</td>
          <td>Strong brand recognition, extensive distribution network</td>
          <td>Higher pricing, slower innovation cycle</td>
        </tr>
        <tr>
          <td>Competitor B</td>
          <td>25%</td>
          <td>Cutting-edge technology, aggressive pricing</td>
          <td>Limited customer support, narrower product range</td>
        </tr>
        <tr>
          <td>Our Company</td>
          <td>15%</td>
          <td>Superior quality, excellent customer service</td>
          <td>Lower brand awareness, limited marketing budget</td>
        </tr>
      </table>
      
      <h2>Target Audience</h2>
      <h3>Primary Market</h3>
      <p>Our primary target market consists of [demographic details] who [behavioral characteristics]. This segment represents approximately X% of the total market and has the following characteristics:</p>
      <ul>
        <li>Age range: XX-XX</li>
        <li>Income level: $XX,XXX - $XX,XXX</li>
        <li>Education: [level]</li>
        <li>Key pain points: [pain point 1], [pain point 2]</li>
      </ul>
      
      <h3>Secondary Market</h3>
      <p>Our secondary target market includes [demographic details] who [behavioral characteristics]. While smaller in size, this segment offers significant growth potential due to [reasons].</p>
      
      <h2>Marketing Objectives</h2>
      <ol>
        <li>Increase market share from 15% to 20% by Q4</li>
        <li>Generate $X million in revenue (X% increase from previous year)</li>
        <li>Improve customer retention rate by X%</li>
        <li>Launch X new products/features</li>
        <li>Expand into X new geographic markets</li>
      </ol>
      
      <h2>Marketing Strategy</h2>
      <h3>Positioning Statement</h3>
      <p>For [target customer] who [customer need], [Product/Service] provides [key benefit] unlike [primary competitor] because [key differentiator].</p>
      
      <h3>Marketing Mix</h3>
      <h4>Product</h4>
      <p>Our product strategy focuses on [key aspects]. Key initiatives include:</p>
      <ul>
        <li>Launching [new product/feature] in Q2</li>
        <li>Enhancing [existing product] with [improvements]</li>
        <li>Discontinuing [underperforming product] by Q3</li>
      </ul>
      
      <h4>Price</h4>
      <p>Our pricing strategy will be [strategy type]. Specific actions include:</p>
      <ul>
        <li>Implementing a [pricing model] for [product/service]</li>
        <li>Offering [promotional discounts] during [time periods]</li>
        <li>Introducing [loyalty program/volume discounts]</li>
      </ul>
      
      <h4>Promotion</h4>
      <p>Our promotional strategy will leverage multiple channels to reach our target audience:</p>
      <ul>
        <li>Digital Marketing: SEO, SEM, social media campaigns, content marketing</li>
        <li>Traditional Marketing: PR, print advertising, industry events</li>
        <li>Direct Marketing: Email campaigns, direct mail to key accounts</li>
      </ul>
      
      <h4>Place</h4>
      <p>Our distribution strategy will focus on [key aspects]:</p>
      <ul>
        <li>Expanding our online presence through [channels]</li>
        <li>Partnering with [distribution partners]</li>
        <li>Opening [number] new physical locations in [regions]</li>
      </ul>
      
      <h2>Budget and Resources</h2>
      <p>The total marketing budget for the fiscal year is $X,XXX,XXX, allocated as follows:</p>
      <ul>
        <li>Digital Marketing: $XXX,XXX (X%)</li>
        <li>Traditional Marketing: $XXX,XXX (X%)</li>
        <li>Product Development: $XXX,XXX (X%)</li>
        <li>Market Research: $XXX,XXX (X%)</li>
        <li>Contingency: $XXX,XXX (X%)</li>
      </ul>
      
      <h2>Implementation Timeline</h2>
      <table border="1" cellpadding="5">
        <tr>
          <th>Initiative</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Responsible Party</th>
        </tr>
        <tr>
          <td>Website Redesign</td>
          <td>Jan 15</td>
          <td>Mar 30</td>
          <td>Digital Team</td>
        </tr>
        <tr>
          <td>Spring Campaign</td>
          <td>Apr 1</td>
          <td>Jun 15</td>
          <td>Marketing Team</td>
        </tr>
        <tr>
          <td>Product Launch</td>
          <td>Jul 1</td>
          <td>Aug 30</td>
          <td>Product & Marketing</td>
        </tr>
      </table>
      
      <h2>Evaluation and KPIs</h2>
      <p>We will measure the success of our marketing efforts using the following key performance indicators:</p>
      <ul>
        <li>Market Share: Target X% by Q4</li>
        <li>Revenue Growth: Target X% year-over-year</li>
        <li>Customer Acquisition Cost: Reduce by X%</li>
        <li>Customer Lifetime Value: Increase by X%</li>
        <li>Website Traffic: Increase by X%</li>
        <li>Conversion Rate: Improve to X%</li>
      </ul>
    `,
  },
  {
    id: "research-report",
    name: "Research Report",
    description: "A template for academic or business research reports",
    preview: `
      <h1>Research Report</h1>
      <h2>Abstract</h2>
      <p>A brief summary of the research, including methods and key findings.</p>
      <h2>Introduction</h2>
      <p>Background information and the purpose of the research.</p>
      <h2>Methodology</h2>
      <p>Description of research methods and data collection.</p>
    `,
    sampleContent: `
      <h1>Research Report</h1>
      
      <h2>Abstract</h2>
      <p>This research report investigates [research topic] through [methodology]. The study involved [sample size/description] and was conducted over [timeframe]. Key findings indicate [brief summary of results]. These findings have significant implications for [field/industry] and suggest [recommendations/future directions].</p>
      
      <h2>1. Introduction</h2>
      <h3>1.1 Background</h3>
      <p>The field of [research area] has seen significant developments in recent years, particularly in [specific aspects]. However, there remains a gap in understanding [specific issue], which this research aims to address.</p>
      
      <h3>1.2 Research Objectives</h3>
      <p>This study seeks to:</p>
      <ol>
        <li>Investigate the relationship between [variable A] and [variable B]</li>
        <li>Determine the impact of [factor] on [outcome]</li>
        <li>Develop a framework for understanding [phenomenon]</li>
      </ol>
      
      <h3>1.3 Significance of the Study</h3>
      <p>This research contributes to the existing body of knowledge by [specific contribution]. The findings have practical applications in [industry/field] and can inform [specific practices/policies].</p>
      
      <h2>2. Literature Review</h2>
      <h3>2.1 Theoretical Framework</h3>
      <p>This study is grounded in [theoretical perspective], which posits that [key principles]. Previous research by [Author (Year)] established [foundational concept], while [Author (Year)] expanded this understanding to include [additional aspects].</p>
      
      <h3>2.2 Previous Research</h3>
      <p>Several studies have examined aspects of [research topic]. [Author (Year)] found that [findings], while [Author (Year)] demonstrated [different findings]. However, these studies were limited by [limitations], which the current research addresses through [improvements].</p>
      
      <h3>2.3 Research Gap</h3>
      <p>Despite extensive research in this area, there remains insufficient understanding of [specific aspect]. This study addresses this gap by [approach].</p>
      
      <h2>3. Methodology</h2>
      <h3>3.1 Research Design</h3>
      <p>This study employed a [research design type] approach to investigate the research questions. This design was selected because [rationale].</p>
      
      <h3>3.2 Participants</h3>
      <p>The study included [number] participants, selected through [sampling method]. Participants had the following characteristics:</p>
      <ul>
        <li>Age range: [range] years</li>
        <li>Gender distribution: [distribution]</li>
        <li>Educational background: [details]</li>
        <li>Other relevant demographics: [details]</li>
      </ul>
      
      <h3>3.3 Data Collection</h3>
      <p>Data was collected through [methods], which included [specific instruments/approaches]. The [instrument name] was used to measure [variable], with a reliability coefficient of [value]. Data collection occurred over [timeframe] and involved [procedures].</p>
      
      <h3>3.4 Data Analysis</h3>
      <p>The collected data was analyzed using [statistical methods/analytical approach]. This included [specific analyses] to examine [relationships/patterns]. Statistical significance was set at p < [value].</p>
      
      <h2>4. Results</h2>
      <h3>4.1 Descriptive Statistics</h3>
      <p>Analysis of the data revealed the following descriptive statistics:</p>
      <table border="1" cellpadding="5">
        <tr>
          <th>Variable</th>
          <th>Mean</th>
          <th>Standard Deviation</th>
          <th>Range</th>
        </tr>
        <tr>
          <td>Variable A</td>
          <td>XX.X</td>
          <td>X.XX</td>
          <td>XX-XX</td>
        </tr>
        <tr>
          <td>Variable B</td>
          <td>XX.X</td>
          <td>X.XX</td>
          <td>XX-XX</td>
        </tr>
      </table>
      
      <h3>4.2 Key Findings</h3>
      <p>The analysis yielded several significant findings:</p>
      <ol>
        <li>Finding 1: [description of finding and statistical significance]</li>
        <li>Finding 2: [description of finding and statistical significance]</li>
        <li>Finding 3: [description of finding and statistical significance]</li>
      </ol>
      
      <h2>5. Discussion</h2>
      <h3>5.1 Interpretation of Results</h3>
      <p>The findings suggest that [interpretation]. This aligns with previous research by [Author (Year)], who found [similar findings]. However, our results diverge from [Author (Year)]'s conclusions regarding [aspect], possibly due to [reasons].</p>
      
      <h3>5.2 Implications</h3>
      <p>These findings have several implications for [field/practice]:</p>
      <ul>
        <li>Implication 1: [description]</li>
        <li>Implication 2: [description]</li>
        <li>Implication 3: [description]</li>
      </ul>
      
      <h3>5.3 Limitations</h3>
      <p>This study has several limitations that should be considered when interpreting the results:</p>
      <ul>
        <li>Limitation 1: [description]</li>
        <li>Limitation 2: [description]</li>
        <li>Limitation 3: [description]</li>
      </ul>
      
      <h2>6. Conclusion</h2>
      <h3>6.1 Summary of Findings</h3>
      <p>This research investigated [topic] and found [summary of key findings]. These results contribute to our understanding of [phenomenon] by [specific contribution].</p>
      
      <h3>6.2 Recommendations</h3>
      <p>Based on these findings, we recommend the following:</p>
      <ol>
        <li>Recommendation 1: [description]</li>
        <li>Recommendation 2: [description]</li>
        <li>Recommendation 3: [description]</li>
      </ol>
      
      <h3>6.3 Future Research</h3>
      <p>Future research should explore [areas], particularly focusing on [specific aspects]. Additionally, [methodological improvements] would enhance our understanding of [topic].</p>
      
      <h2>References</h2>
      <p>[Author Last Name], [First Initial]. ([Year]). [Title of article]. [Journal Name], [Volume]([Issue]), [Page range].</p>
      <p>[Author Last Name], [First Initial]. ([Year]). [Title of article]. [Journal Name], [Volume]([Issue]), [Page range].</p>
      <p>[Author Last Name], [First Initial]. ([Year]). [Title of article]. [Journal Name], [Volume]([Issue]), [Page range].</p>
    `,
  },
]

export const sampleDocuments = [
  {
    id: "doc-1",
    title: "Q1 Marketing Strategy",
    template: "Marketing Plan",
    content: templates.find((t) => t.id === "marketing-plan")?.sampleContent || "",
    createdAt: "2025-05-01T10:30:00Z",
    pages: 12,
    projectId: "project1",
    referencedDocuments: [
      { id: "ref-1", title: "Market Research Data" },
      { id: "ref-2", title: "Competitor Analysis" },
    ],
  },
  {
    id: "doc-2",
    title: "Product Launch Proposal",
    template: "Business Proposal",
    content: templates.find((t) => t.id === "business-proposal")?.sampleContent || "",
    createdAt: "2025-05-05T14:20:00Z",
    pages: 8,
    projectId: "project1",
    referencedDocuments: [{ id: "ref-3", title: "Product Specifications" }],
  },
  {
    id: "doc-3",
    title: "Mobile App Requirements",
    template: "Software Requirements Specification",
    content: templates.find((t) => t.id === "srs-document")?.sampleContent || "",
    createdAt: "2025-05-08T09:15:00Z",
    pages: 15,
    projectId: "project2",
    referencedDocuments: [],
  },
  {
    id: "doc-4",
    title: "Market Research: Competitor Analysis",
    template: "Research Report",
    content: templates.find((t) => t.id === "research-report")?.sampleContent || "",
    createdAt: "2025-05-10T16:45:00Z",
    pages: 20,
    projectId: "project3",
    referencedDocuments: [
      { id: "ref-4", title: "Industry Survey Results" },
      { id: "ref-5", title: "Market Trends 2025" },
    ],
  },
  {
    id: "doc-5",
    title: "Website Redesign Proposal",
    template: "Business Proposal",
    content: templates.find((t) => t.id === "business-proposal")?.sampleContent || "",
    createdAt: "2025-05-12T11:30:00Z",
    pages: 6,
    projectId: "project2",
    referencedDocuments: [],
  },
  {
    id: "doc-6",
    title: "Annual Sales Report",
    template: "Research Report",
    content: templates.find((t) => t.id === "research-report")?.sampleContent || "",
    createdAt: "2025-05-11T13:25:00Z",
    pages: 18,
    projectId: "project1",
    referencedDocuments: [
      { id: "ref-6", title: "Sales Data 2024" },
      { id: "ref-7", title: "Regional Performance Analysis" },
    ],
  },
]
