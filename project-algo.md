1.  **headPhones**

2. press **START** 
    *   **createQuestion**
        *   create the target note based on the hierarchy taken from the paper
            *   [ diatonic triad > diatonic other > non diatonic ]
                *   d triad [ 1, 3, 5 ]
                *   d other [ 2, 4, 6, 7 ]
                *   d other [ b2, b3, b5, b6, b7 ]
        *   **displayQuestion**
            *   print the targetNote
        *   play **contextChord**
            *   play the chord over which you sing the targetNote
                *   copy code from *Pitch Machine*

3.  **ENTER targetNote**

    *   progressbar starts
    *   conditional check
        *   if ( prev === current) { continue }
        *   else { cancelProgressbar }

4.  **implement multiple chords**

    *   button that switches **contextChord** and **chordScale**
        *   create diatonic variables for each chord and scale

    ​


