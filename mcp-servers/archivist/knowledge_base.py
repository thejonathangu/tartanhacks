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
    },
}
