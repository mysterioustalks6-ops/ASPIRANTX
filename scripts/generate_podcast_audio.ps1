Add-Type -AssemblyName System.Speech

$audioDir = "$PSScriptRoot\..\public\audio"
if (!(Test-Path $audioDir)) {
    New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100

# Episode 1: Polity & Governance GS Paper 2 Strategy
$ep1File = "$audioDir\upsc_gs2_polity_masterclass.wav"
$synth.SetOutputToWaveFile($ep1File)
$synth.Speak("Welcome to the AspirantX Academic Masterclass on General Studies Paper 2, Polity and Governance. In this masterclass, we break down high-scoring answer writing frameworks for the Civil Services Mains Examination. First, focus on the structural anatomy of your answers. Introduce every polity question with the relevant Constitutional Article or Directive Principle. Second, substantiate your arguments with landmark Supreme Court judgments such as Kesavananda Bharati, Puttaswamy, and Minerva Mills. Third, in governance and administrative questions, always incorporate recommendations from the Second Administrative Reforms Commission. Consistent practice with previous year questions and schematic flowcharts will ensure superior marks in Paper 2.")

# Episode 2: Geography Optional & Mapping Technique Guide
$ep2File = "$audioDir\geography_answer_writing_guide.wav"
$synth.SetOutputToWaveFile($ep2File)
$synth.Speak("Welcome to the AspirantX Geography Strategy Session. For both Prelims and the Geography Optional papers, spatial visualization is your highest leverage tool. In Paper 1, connect geomorphological and climatological theories with real-world contemporary phenomena. In Paper 2, every single question on regional planning, agriculture, or industrial corridors must be accompanied by an accurate, hand-drawn outline map of India. Use standard cartographic symbols for mineral belts, river basins, and national waterways. This structured spatial presentation directly separates top-percentile answers from average submissions.")

# Episode 3: NEET UG High-Yield Physics & Diagrammatic Biology
$ep3File = "$audioDir\neet_physics_problem_solving.wav"
$synth.SetOutputToWaveFile($ep3File)
$synth.Speak("Welcome to the AspirantX NEET UG Strategy Briefing. Achieving a 700 plus score in NEET requires total mastery of NCERT and rapid numerical accuracy in Physics. For Biology, every line, diagram caption, and summary table across Class 11 and 12 NCERT must be treated as a potential question. For Physics, master unit dimension checks, limiting-case analysis, and formula sheets for Mechanics, Electrodynamics, and Optics. Always solve numerical problems in timed blocks of 45 seconds to build speed and eliminate negative marking under exam pressure.")

$synth.Dispose()

Write-Host "All 3 strategy masterclass audio files generated successfully in $audioDir"
Get-ChildItem $audioDir | Select-Object Name, Length
