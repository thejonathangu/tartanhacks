"""
ArchivistAgent — In-memory knowledge base.

Mirrors the frontend GeoJSON.  Each entry contains the quote,
historical context, and dialect note for a literary landmark.
"""

KNOWLEDGE_BASE: dict[str, dict] = {
    "jlc-san-francisco": {
        "quote": (
            "I wanted my children to have the best combination: "
            "American circumstances and Chinese character."
        ),
        "historical_context": (
            "Between 1910 and 1940, approximately 175,000 Chinese immigrants "
            "were processed through Angel Island Immigration Station in San "
            "Francisco Bay. Post-WWII legislation like the War Brides Act of "
            "1945 allowed Chinese-American veterans to bring their wives to "
            "the United States, catalysing a new wave of family reunification."
        ),
        "dialect_note": (
            "Cantonese-English code-switching was common in SF Chinatown "
            "households of the 1940s–50s."
        ),
        "year": 1949,
        "book": "The Joy Luck Club",
        "era": "1940s",
        "mood": ["hope", "longing", "displacement", "new beginnings"],
    },
    "jlc-chinatown": {
        "quote": "We are not those kind of people—we are better.",
        "historical_context": (
            "San Francisco's Chinatown is the oldest in North America, "
            "established during the California Gold Rush in the 1840s. By the "
            "1940s it was a dense, vibrant enclave where Cantonese opera houses, "
            "herbalist shops, and family associations preserved cultural ties "
            "across the Pacific."
        ),
        "dialect_note": (
            "Grant Avenue was known as 'Dupont Gai' (都板街) in Cantonese. "
            "Street names were often given dual Chinese/English identities."
        ),
        "year": 1949,
        "book": "The Joy Luck Club",
        "era": "1940s",
        "mood": ["pride", "community", "tradition", "resilience"],
    },
    "hr-harlem": {
        "quote": "I, too, sing America. I am the darker brother.",
        "historical_context": (
            "The Cotton Club, located at 644 Lenox Avenue (142nd St), operated "
            "from 1923–1940. While it showcased Black performers like Duke "
            "Ellington and Cab Calloway, it enforced a whites-only audience "
            "policy — a painful irony of the era. The Harlem Renaissance "
            "produced a literary and artistic explosion that redefined Black "
            "identity in America."
        ),
        "dialect_note": (
            "1920s Harlem slang: 'copacetic' (excellent), 'the bee's knees' "
            "(outstanding), 'jive' (misleading talk)."
        ),
        "year": 1925,
        "book": "Harlem Renaissance Anthology",
        "era": "1920s",
        "mood": ["vibrant", "music", "defiance", "joy", "nightlife"],
    },
    "hr-apollo": {
        "quote": (
            "Life is for the living. Death is for the dead. "
            "Let life be like music. And death a note unsaid."
        ),
        "historical_context": (
            "The Apollo Theater at 253 W 125th St opened to all races in 1934. "
            "Its legendary Amateur Night launched the careers of Ella Fitzgerald, "
            "James Brown, Stevie Wonder, and countless others. It remains a "
            "cornerstone of Black American cultural heritage."
        ),
        "dialect_note": (
            "Apollo MC's popularized call-and-response with the audience — "
            "a West African oral tradition adapted to the urban stage."
        ),
        "year": 1934,
        "book": "Harlem Renaissance Anthology",
        "era": "1920s",
        "mood": ["performance", "energy", "ambition", "celebration"],
    },
    "hr-cathedral": {
        "quote": (
            "Hold fast to dreams, for if dreams die, life is a "
            "broken-winged bird that cannot fly."
        ),
        "historical_context": (
            "The Cathedral of St. John the Divine, the world's largest "
            "Anglican cathedral, sits at the boundary of Harlem and "
            "Morningside Heights. Langston Hughes and Countee Cullen both "
            "attended literary events here, bridging uptown Black culture "
            "with downtown white institutions."
        ),
        "dialect_note": (
            "Cullen and Hughes represented two poles of Renaissance style: "
            "Cullen's formal sonnets vs. Hughes's jazz-inflected free verse."
        ),
        "year": 1925,
        "book": "Harlem Renaissance Anthology",
        "era": "1920s",
        "mood": ["dreams", "melancholy", "aspiration", "spirituality", "quiet reflection"],
    },
    "cr-montgomery": {
        "quote": (
            "People always say that I didn't give up my seat because I was "
            "tired, but that isn't true. I was tired of giving in."
        ),
        "historical_context": (
            "Rosa Parks was arrested on December 1, 1955 on a Montgomery City "
            "Lines bus. The subsequent 381-day boycott, led by a young Dr. "
            "Martin Luther King Jr., resulted in the Browder v. Gayle Supreme "
            "Court ruling that declared segregated buses unconstitutional. The "
            "boycott is widely regarded as the first large-scale demonstration "
            "against segregation in the U.S."
        ),
        "dialect_note": (
            "Southern Black vernacular of the 1950s–60s: 'fixing to' (about "
            "to), 'carry' (to drive someone), 'might could' (might be able to)."
        ),
        "year": 1955,
        "book": "Civil Rights Landmarks",
        "era": "1960s",
        "mood": ["courage", "exhaustion", "defiance", "dignity"],
    },
    "cr-birmingham": {
        "quote": "Injustice anywhere is a threat to justice everywhere.",
        "historical_context": (
            "On September 15, 1963, members of the KKK bombed the 16th Street "
            "Baptist Church in Birmingham, Alabama, killing four young girls: "
            "Addie Mae Collins, Cynthia Wesley, Carole Robertson, and Carol "
            "Denise McNair. The tragedy galvanized national support for the "
            "Civil Rights Act of 1964."
        ),
        "dialect_note": (
            "Birmingham was nicknamed 'Bombingham' by residents — over 50 "
            "racially motivated bombings occurred between 1947 and 1965."
        ),
        "year": 1963,
        "book": "Civil Rights Landmarks",
        "era": "1960s",
        "mood": ["tragedy", "anger", "grief", "determination", "injustice"],
    },
    "cr-lincoln-memorial": {
        "quote": (
            "I have a dream that my four little children will one day live "
            "in a nation where they will not be judged by the color of "
            "their skin."
        ),
        "historical_context": (
            "On August 28, 1963, over 250,000 people gathered at the Lincoln "
            "Memorial for the March on Washington for Jobs and Freedom. Dr. "
            "King's 'I Have a Dream' speech, partially improvised, became "
            "the defining oration of the American civil rights movement."
        ),
        "dialect_note": (
            "King's oratory blended Southern Baptist preaching cadence with "
            "the rhetorical tradition of Frederick Douglass and the prophetic "
            "tradition of the Black church."
        ),
        "year": 1963,
        "book": "Civil Rights Landmarks",
        "era": "1960s",
        "mood": ["hope", "unity", "power", "inspiration", "conviction"],
    },
}
