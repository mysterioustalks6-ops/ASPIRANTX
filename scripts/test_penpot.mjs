const token = process.env.PENPOT_ACCESS_TOKEN || 'eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.d7r9MGfg50_apC9udh8tfWEYqbLlAa2MWoAnZ9CCjqJRbs8-QevyPg.w20YXFxSEQzD4F1O.vF2whyAqtCAEmE9B7lNxoVPD_RG4D6XsfRAOz9CWxF3VFfVHEdlJpJPYMR3dUfaDpglGh3qj6TtI1xDxm2ub8XnIafOf23tYvuKGSnFbewIfua8TTZS6AZzQRjlJ1eMeZeqzaBlN2cZVArxHMtC6mLEC-_1jW_MrYt4fwWHQSCMqxQ9xfjRW4vTS06S0Zls7y_TIroIfAMrE.zUnJIHXzySDvBODjIm6i-g';

async function test() {
  const profileRes = await fetch('https://design.penpot.app/api/rpc/command/get-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token },
    body: JSON.stringify({})
  });
  const profile = await profileRes.json();
  console.log('Profile:', profile.id, profile.email, profile.defaultTeamId);

  const teamsRes = await fetch('https://design.penpot.app/api/rpc/command/get-teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token },
    body: JSON.stringify({})
  });
  const teams = await teamsRes.json();
  console.log('Teams:', JSON.stringify(teams, null, 2));

  // Projects in default team
  const projRes = await fetch('https://design.penpot.app/api/rpc/command/get-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token },
    body: JSON.stringify({ teamId: profile.defaultTeamId })
  });
  const projects = await projRes.json();
  console.log('Projects count:', projects.length);
  for (const p of projects) {
    console.log(`- Project: ${p.name} (ID: ${p.id})`);
  }
}

test().catch(console.error);
