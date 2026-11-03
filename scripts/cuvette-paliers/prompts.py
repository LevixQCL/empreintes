PRE="bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. Fixed isometric three-quarter top-down view, same camera angle, same scale and same warm evening light as the surrounding sunken stone district. Inside the erased area stands "
SUF=" Salvage technology style: weathered sandstone, riveted copper, reclaimed machine parts, cables, glass and glowing blue crystal. One single building, it fills the erased silhouette exactly, its foot sits on its round stone platform (or on the wooden pier for the harbor), it blends seamlessly with the paved ground, paths and stairs around it. No people, no text, no letters, no village cottage, no cute house --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp https://levixqcl.github.io/empreintes/art/district/cuvette.webp --sw 100"
LOW="the EARLY, MODEST version: small, makeshift and freshly started, patched scrap, canvas tarps, a bit of wooden scaffolding, only a faint touch of blue crystal: "
HIGH="the FULLY DEVELOPED, GRAND version: bigger, prouder and more elaborate than before, polished copper, extra machinery, bright glowing blue crystal, warm lit windows: "
D={
'tour':("the Core Tower, a sturdy round sandstone tower with copper bands built over a deep mine shaft",
  "a short wooden mining headframe (A-frame with a pulley wheel) straddling the glowing shaft opening, a small plank winch shed beside it, ropes and a hand-cranked hoist bucket, faint blue glow rising from the shaft",
  "the tall round sandstone tower with copper bands and lit windows, crowned by a large glowing blue crystal in a copper cage; at its right a big riveted steel headframe with a large pulley wheel and cables plunging into the shaft, at its left an inclined copper conveyor carrying blue crystal ore, a heavy winch at its foot"),
'forge':("the Forge",
  "an open-air forge: a small brick and stone furnace with a glowing mouth, one thin patched stovepipe, an anvil and a quenching barrel under a slanted canvas awning",
  "a big forge hall of stone and copper with two glowing furnaces, a very tall wide iron chimney topped by an ember cage with smoke, a large steam hammer arm on a copper gantry, blue crystal glow in the quenching trough"),
'clinique':("the Clinic",
  "a field infirmary: a small salvaged metal container with a round window, a canvas tarp stretched on poles over it, one glass healing capsule glowing faintly blue, a small lantern post",
  "a large clinic pavilion under a big frosted glass dome on a copper frame, two side wings lined with glowing blue healing capsules, a slender copper lantern spire with a blue crystal light at the left, a second small lantern tower at the right"),
'labo':("the Genetics Lab",
  "a small armored steel box with a round vault hatch, a single glass bell jar on top holding a small glowing blue crystal helix, a few cables",
  "a wide armored bunker with a big round vault door and portholes, a tall glass bell rising above it holding a large glowing double helix of blue crystal, a jointed copper lens arm and thin antennas on the roof"),
'generateur':("the Generator",
  "a small patched copper dynamo barrel with a single turbine wheel on its side and a short thin rod of blue crystal humming on top, loose cables",
  "a huge riveted copper dynamo with three spinning turbine wheels, a very tall glowing blue crystal column in a copper cage rising from its top, thick cables running away toward the dike pumps"),
'comptoir':("the Trading Post",
  "a modest round market stall under a stretched canvas awning, a few crates and baskets of crystal shards, a small wooden hand crane with a rope and a hanging net",
  "a large round covered market hall of copper and sandstone with a domed roof and stalls all around, piles of glowing crystal shards, a tall copper counterweight crane with a long jib and a hanging crate"),
'port':("the Harbor, on the wooden pier in the water",
  "a small fisherman's plank hut with a slanted roof on the pier, a lantern pole, and a small plain rowboat moored in the channel; leave the dark water as it is",
  "a two-storey round copper harbor master's house on the pier, topped by a small lighthouse lantern of glowing blue crystal, crates and coiled ropes, and a large boat with a crystal lantern on a mast moored in the channel; leave the dark water as it is"),
}
NOMS={'tour':'Tour du Noyau','forge':'Forge','clinique':'Clinique','labo':'Labo génétique','generateur':'Générateur','comptoir':'Comptoir','port':'Port'}
P={}
for k,(nom,bas,haut) in D.items():
    P[f'{k}-bas']=PRE+LOW+nom+": "+bas+"."+SUF
    P[f'{k}-haut']=PRE+HIGH+nom+": "+haut+"."+SUF
