import React from 'react';

/**
 * A lightweight, hand-drawn campus scene for the footer.
 * The three connected vignettes show classroom study, students walking,
 * and practical laboratory work. Motion is subtle and respects reduced-motion.
 */
export default function FooterScienceIllustration() {
  return (
    <svg
      className="footer-science-art"
      viewBox="0 0 1440 340"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="footer-campus-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--footer-art-periwinkle)" stopOpacity=".8" />
          <stop offset="1" stopColor="var(--footer-art-mint)" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="footer-campus-coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--footer-art-white)" />
          <stop offset="1" stopColor="var(--footer-art-periwinkle)" />
        </linearGradient>
      </defs>
      <style>{`
        .footer-campus-line { stroke: var(--footer-art-ink); stroke-linecap: round; stroke-linejoin: round; }
        .footer-campus-student { stroke: var(--footer-art-ink); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .footer-campus-walk-leg { transform-box: view-box; transform-origin: 50% 244px; animation: footer-campus-walk 0.55s ease-in-out infinite alternate; }
        .footer-campus-walker { transform-box: view-box; animation: footer-campus-bob .55s ease-in-out infinite alternate; }
        .footer-campus-walker--two { animation-delay: -.275s; }
        .footer-campus-lab-hand { transform-box: view-box; transform-origin: 1215px 185px; animation: footer-campus-lab-work 1.2s ease-in-out infinite alternate; }
        .footer-campus-flask-liquid { transform-box: view-box; transform-origin: 1177px 211px; animation: footer-campus-liquid 2s ease-in-out infinite alternate; }
        .footer-campus-walk-leg--delay { animation-delay: -.55s; }
        .footer-campus-writing-hand { transform-box: fill-box; transform-origin: 20% 50%; animation: footer-campus-write 1.8s ease-in-out infinite; }
        .footer-campus-bubble { transform-box: fill-box; transform-origin: center; animation: footer-campus-bubble 3.2s ease-in-out infinite; }
        .footer-campus-bubble--delay { animation-delay: -1.6s; }
        @keyframes footer-campus-walk { from { transform: rotate(-18deg); } to { transform: rotate(18deg); } }
        @keyframes footer-campus-bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
        @keyframes footer-campus-lab-work { from { transform: rotate(-5deg); } to { transform: rotate(7deg); } }
        @keyframes footer-campus-liquid { from { transform: translateY(1px); } to { transform: translateY(-2px); } }
        @keyframes footer-campus-write { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(7deg); } }
        @keyframes footer-campus-bubble { 0%,100% { opacity: .45; transform: translateY(2px); } 50% { opacity: 1; transform: translateY(-5px); } }
        @media (prefers-reduced-motion: reduce) {
          .footer-campus-walk-leg, .footer-campus-writing-hand, .footer-campus-bubble, .footer-campus-walker, .footer-campus-lab-hand, .footer-campus-flask-liquid { animation: none; }
        }
      `}</style>

      {/* Soft campus architecture connects the three real-life learning scenes. */}
      <g className="footer-campus-line" fill="none" strokeWidth="3" opacity=".68">
        <path d="M20 284H1420" strokeWidth="5" />
        <path d="M35 90V284M35 90H445M445 90V284" strokeOpacity=".32" />
        <path d="M995 75H1405V284M995 75V284" strokeOpacity=".32" />
        <path d="M58 112H420M1020 96H1380" strokeOpacity=".22" />
        <path d="M75 112V180M145 112V180M215 112V180M285 112V180M355 112V180" strokeOpacity=".2" />
        <path d="M1040 96V174M1110 96V174M1180 96V174M1250 96V174M1320 96V174" strokeOpacity=".2" />
      </g>

      {/* CLASSROOM — two students taking notes at shared desks. */}
      <g id="footer-campus-classroom">
        <rect x="68" y="62" width="112" height="58" rx="5" fill="url(#footer-campus-glass)" stroke="var(--footer-art-blue)" strokeWidth="3" />
        <path d="M124 62V120M68 91H180" className="footer-campus-line" fill="none" strokeWidth="2" opacity=".55" />
        <path d="M205 72H353" className="footer-campus-line" fill="none" strokeWidth="5" opacity=".7" />
        <path d="M221 83H320" className="footer-campus-line" fill="none" strokeWidth="2" opacity=".5" />
        <text x="210" y="56" fill="var(--footer-art-blue)" fontSize="18" fontWeight="700" letterSpacing="2">CLASSROOM</text>

        {/* Student A: natural seated posture, curly hair, shirt and notebook. */}
        <g className="footer-campus-student">
          <path d="M118 188Q118 169 136 165L160 168Q177 176 176 198L170 224H119Z" fill="var(--footer-art-blue)" />
          <path d="M130 215L126 246L159 246L164 216" fill="var(--footer-art-blue)" />
          <path d="M128 243L120 271M156 244L165 271" fill="none" strokeWidth="9" />
          <path d="M111 270H132M157 270H178" fill="none" strokeWidth="6" />
          <path d="M125 143Q121 126 134 119Q150 113 161 126L165 146L154 160H134Z" fill="var(--footer-art-skin-medium)" />
          <path d="M124 139Q112 123 128 111Q142 101 157 112Q171 121 163 140L156 130L145 124L132 134Z" fill="var(--footer-art-hair-dark)" />
          <path d="M133 148Q144 155 155 147" fill="none" strokeWidth="2" />
          <path d="M133 168L112 191L135 205" fill="none" strokeWidth="10" />
          <path d="M165 176L183 201L202 202" fill="none" strokeWidth="9" />
          <path d="M202 202L211 195" fill="none" strokeWidth="5" />
          <path d="M114 206H211L223 253H103Z" fill="var(--footer-art-wood)" />
          <path d="M124 253L121 283M202 253L207 283" fill="none" strokeWidth="6" />
          <path d="M145 195L180 191L194 213L158 221Z" fill="var(--footer-art-white)" />
          <path d="M160 201L184 198M162 207L188 204M164 213L190 210" fill="none" stroke="var(--footer-art-blue)" strokeWidth="1.8" />
          <g className="footer-campus-writing-hand">
            <path d="M190 199L211 190" fill="none" strokeWidth="6" />
            <path d="M208 190L220 183" fill="none" stroke="var(--footer-art-gold)" strokeWidth="3" />
          </g>
        </g>

        {/* Student B, leaning toward the shared lesson. */}
        <g className="footer-campus-student">
          <path d="M263 191Q263 172 282 168L303 173Q317 184 314 205L309 226H266Z" fill="var(--footer-art-mint)" />
          <path d="M273 217L272 247H303L305 218" fill="var(--footer-art-mint)" />
          <path d="M278 244L270 272M300 244L310 272" fill="none" strokeWidth="9" />
          <path d="M261 272H280M301 272H320" fill="none" strokeWidth="6" />
          <path d="M272 146Q267 128 281 120Q296 114 307 128L310 148L299 162H281Z" fill="var(--footer-art-skin-deep)" />
          <path d="M270 140Q263 121 282 111Q303 105 313 124L307 137L300 126L281 128L278 145Z" fill="var(--footer-art-hair-dark)" />
          <path d="M282 149Q291 155 300 148" fill="none" strokeWidth="2" />
          <path d="M273 178L254 200L235 201" fill="none" strokeWidth="9" />
          <path d="M306 181L329 202L346 196" fill="none" strokeWidth="9" />
          <path d="M346 196L354 190" fill="none" strokeWidth="5" />
          <path d="M229 205H354L365 253H219Z" fill="var(--footer-art-wood)" />
          <path d="M241 253L238 283M344 253L347 283" fill="none" strokeWidth="6" />
          <path d="M275 196L307 199L322 218L288 220Z" fill="var(--footer-art-white)" />
          <path d="M286 205L309 207M289 211L313 213" fill="none" stroke="var(--footer-art-blue)" strokeWidth="1.8" />
        </g>
        <g className="footer-campus-line" fill="none" strokeWidth="3" opacity=".6">
          <path d="M72 284H385" />
          <path d="M81 284V309M376 284V309" />
        </g>
      </g>

      {/* CAMPUS WALKWAY — two students moving between classes. */}
      <g id="footer-campus-walkway">
        <path d="M472 284Q640 255 800 284" fill="none" stroke="var(--footer-art-mint)" strokeWidth="5" strokeLinecap="round" opacity=".8" />
        <text x="585" y="83" fill="var(--footer-art-blue)" fontSize="18" fontWeight="700" letterSpacing="2">CAMPUS LIFE</text><path d="M495 301H779" className="footer-campus-line" fill="none" strokeWidth="2" strokeDasharray="4 12" opacity=".5" />
        <g className="footer-campus-student">
          {/* Walking student one */}
          <path d="M555 152Q553 132 570 125Q587 120 598 136L598 155L587 168H568Z" fill="var(--footer-art-skin-medium)" />
          <path d="M554 145Q547 125 566 115Q586 108 599 127L596 140L583 129L565 132L563 148Z" fill="var(--footer-art-hair-dark)" />
          <path d="M568 157Q579 164 588 156" fill="none" strokeWidth="2" />
          <path d="M558 171Q576 160 596 173L606 219L552 219Z" fill="var(--footer-art-blue)" />
          <path d="M559 177L539 205L525 222" fill="none" strokeWidth="10" />
          <path d="M597 178L615 198L625 194" fill="none" strokeWidth="10" />
          <path d="M558 214L565 246" fill="none" strokeWidth="12" />
          <g className="footer-campus-walk-leg">
            <path d="M565 242L545 270L527 278" fill="none" strokeWidth="11" />
            <path d="M516 279L532 279" fill="none" strokeWidth="6" />
          </g>
          <g className="footer-campus-walk-leg footer-campus-walk-leg--delay">
            <path d="M590 242L604 268L622 275" fill="none" strokeWidth="11" />
            <path d="M618 276L634 276" fill="none" strokeWidth="6" />
          </g>
          <path d="M596 177Q609 180 612 198L605 223L589 216Z" fill="var(--footer-art-gold)" />
          <path d="M601 184L609 213" fill="none" stroke="var(--footer-art-ink)" strokeWidth="2" opacity=".5" />
          {/* Backpack */}
          <path d="M594 174Q610 174 612 190L611 213L600 215L594 190Z" fill="var(--footer-art-gold)" />
          <path d="M598 182Q590 191 600 202" fill="none" stroke="var(--footer-art-ink)" strokeWidth="2" />
        </g>

        <g className="footer-campus-student">
          {/* Walking student two */}
          <path d="M690 160Q688 141 703 133Q720 127 732 143L733 161L722 173H703Z" fill="var(--footer-art-skin-light)" />
          <path d="M688 152Q683 134 701 123Q720 116 734 135L728 146L715 135L699 140L698 155Z" fill="var(--footer-art-hair-curly)" />
          <path d="M703 162Q714 169 723 162" fill="none" strokeWidth="2" />
          <path d="M694 176Q710 166 730 178L740 221L687 221Z" fill="var(--footer-art-mint)" />
          <path d="M696 182L677 205L664 199" fill="none" strokeWidth="10" />
          <path d="M731 182L747 202L761 207" fill="none" strokeWidth="10" />
          <path d="M695 217L695 244" fill="none" strokeWidth="12" />
          <g className="footer-campus-walk-leg footer-campus-walk-leg--delay">
            <path d="M695 242L677 267L662 274" fill="none" strokeWidth="11" />
            <path d="M652 275L668 275" fill="none" strokeWidth="6" />
          </g>
          <g className="footer-campus-walk-leg">
            <path d="M721 242L739 264L758 271" fill="none" strokeWidth="11" />
            <path d="M753 272L769 272" fill="none" strokeWidth="6" />
          </g>
          <path d="M729 181Q743 181 746 197L744 215L730 214Z" fill="var(--footer-art-blue)" />
          <path d="M738 189L741 208" fill="none" stroke="var(--footer-art-white)" strokeWidth="2" opacity=".7" />
        </g>
        <g className="footer-campus-bubble" fill="var(--footer-art-blue)">
          <circle cx="640" cy="118" r="5" /><circle cx="653" cy="105" r="3" />
        </g>
        <g className="footer-campus-bubble footer-campus-bubble--delay" fill="var(--footer-art-mint)">
          <circle cx="784" cy="149" r="6" /><circle cx="796" cy="135" r="3" />
        </g>
      </g>

      {/* LABORATORY — coat, eye protection, microscope, flask and careful teamwork. */}
      <g id="footer-campus-laboratory">
        <rect x="1050" y="50" width="282" height="78" rx="7" fill="url(#footer-campus-glass)" stroke="var(--footer-art-blue)" strokeWidth="3" />
        <path d="M1191 50V128M1050 89H1332" className="footer-campus-line" fill="none" strokeWidth="2" opacity=".5" />
        <path d="M1080 66H1168M1210 66H1306M1080 108H1168M1210 108H1306" className="footer-campus-line" fill="none" strokeWidth="2" opacity=".28" />
        <text x="1065" y="37" fill="var(--footer-art-blue)" fontSize="18" fontWeight="700" letterSpacing="2">LABORATORY</text>
        {/* Lab partner at left */}
        <g className="footer-campus-student">
          <path d="M1072 178Q1073 157 1092 151Q1110 151 1121 169L1123 202L1070 202Z" fill="url(#footer-campus-coat)" />
          <path d="M1081 176L1095 190L1110 176L1119 221L1073 221Z" fill="var(--footer-art-blue)" opacity=".9" />
          <path d="M1083 145Q1078 128 1092 119Q1108 114 1119 130L1120 147L1109 160H1091Z" fill="var(--footer-art-skin-deep)" />
          <path d="M1080 140Q1075 122 1092 112Q1110 107 1122 126L1118 139L1106 127L1088 130L1087 145Z" fill="var(--footer-art-hair-dark)" />
          <path d="M1088 145L1109 145" fill="none" strokeWidth="3" />
          <path d="M1080 164L1064 190L1082 202" fill="none" strokeWidth="9" />
          <path d="M1117 165L1140 190L1160 188" fill="none" strokeWidth="9" />
          <path d="M1087 179L1101 195L1113 180" fill="none" stroke="var(--footer-art-blue)" strokeWidth="2" />
          <path d="M1149 188L1162 187" fill="none" strokeWidth="5" />
        </g>
        {/* Lab partner at right, wearing protective goggles and white coat */}
        <g className="footer-campus-student">
          <path d="M1242 177Q1243 157 1261 151Q1280 152 1290 169L1292 203L1240 203Z" fill="url(#footer-campus-coat)" />
          <path d="M1250 172L1266 190L1280 172L1289 222L1243 222Z" fill="var(--footer-art-mint)" />
          <path d="M1251 145Q1247 128 1261 119Q1278 114 1290 131L1291 148L1280 160H1261Z" fill="var(--footer-art-skin-medium)" />
          <path d="M1248 140Q1242 123 1260 112Q1280 107 1293 126L1288 139L1276 127L1257 130L1255 145Z" fill="var(--footer-art-hair-curly)" />
          <rect x="1251" y="133" width="15" height="10" rx="4" fill="var(--footer-art-glass)" stroke="var(--footer-art-blue)" strokeWidth="2" />
          <rect x="1271" y="133" width="15" height="10" rx="4" fill="var(--footer-art-glass)" stroke="var(--footer-art-blue)" strokeWidth="2" />
          <path d="M1266 137H1271" fill="none" strokeWidth="2" />
          <g className="footer-campus-lab-hand"><path d="M1250 165L1229 188L1215 185" fill="none" strokeWidth="9" /></g>
          <path d="M1286 166L1305 190L1324 185" fill="none" strokeWidth="9" />
          <path d="M1215 185L1207 182M1324 185L1333 180" fill="none" strokeWidth="5" />
          <path d="M1261 171L1270 190L1280 171" fill="none" stroke="var(--footer-art-blue)" strokeWidth="2" />
        </g>
        {/* Bench, microscope and glassware */}
        <path d="M1025 220H1385" fill="none" stroke="var(--footer-art-wood)" strokeWidth="14" strokeLinecap="round" />
        <path d="M1050 228V283M1360 228V283" className="footer-campus-line" fill="none" strokeWidth="7" />
        <path d="M1115 218V201L1131 185L1144 196L1132 209V218" fill="none" stroke="var(--footer-art-ink)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1128 185L1114 173L1122 164L1141 181" fill="none" stroke="var(--footer-art-blue)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1108 219H1150" fill="none" stroke="var(--footer-art-ink)" strokeWidth="7" strokeLinecap="round" />
        <path d="M1170 177H1182V193L1196 215Q1200 221 1190 221H1161Q1153 221 1158 213L1170 193Z" fill="var(--footer-art-white)" stroke="var(--footer-art-blue)" strokeWidth="2.5" />
        <path className="footer-campus-flask-liquid" d="M1162 209H1193L1197 215Q1200 221 1190 221H1161Q1153 221 1158 213Z" fill="var(--footer-art-mint)" opacity=".9" />
        <path d="M1173 183V193" fill="none" stroke="var(--footer-art-blue)" strokeWidth="2" />
        <circle cx="1170" cy="208" r="2.5" fill="var(--footer-art-blue)" />
        <circle cx="1183" cy="214" r="3" fill="var(--footer-art-blue)" />
        <path d="M1208 220V204L1217 192L1226 204V220" fill="none" stroke="var(--footer-art-gold)" strokeWidth="3" />
      </g>

      {/* Small grounding shadows keep the figures anchored without a boxed background. */}
      <g fill="var(--footer-art-ink)" opacity=".13">
        <ellipse cx="163" cy="286" rx="88" ry="7" />
        <ellipse cx="290" cy="286" rx="83" ry="7" />
        <ellipse cx="574" cy="286" rx="72" ry="7" />
        <ellipse cx="710" cy="286" rx="73" ry="7" />
        <ellipse cx="1200" cy="286" rx="185" ry="7" />
      </g>
    </svg>
  );
}
