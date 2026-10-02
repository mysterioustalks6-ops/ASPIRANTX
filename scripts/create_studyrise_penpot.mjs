const token = process.env.PENPOT_ACCESS_TOKEN || 'eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIn0.d7r9MGfg50_apC9udh8tfWEYqbLlAa2MWoAnZ9CCjqJRbs8-QevyPg.w20YXFxSEQzD4F1O.vF2whyAqtCAEmE9B7lNxoVPD_RG4D6XsfRAOz9CWxF3VFfVHEdlJpJPYMR3dUfaDpglGh3qj6TtI1xDxm2ub8XnIafOf23tYvuKGSnFbewIfua8TTZS6AZzQRjlJ1eMeZeqzaBlN2cZVArxHMtC6mLEC-_1jW_MrYt4fwWHQSCMqxQ9xfjRW4vTS06S0Zls7y_TIroIfAMrE.zUnJIHXzySDvBODjIm6i-g';
const teamId = '24d9d841-759d-81bc-8008-b8c40a9d0ce8';

async function createNewProjectAndFile() {
  console.log('Creating project in team:', teamId);
  const projRes = await fetch('https://design.penpot.app/api/rpc/command/create-project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Token ${token}`
    },
    body: JSON.stringify({
      teamId: teamId,
      name: 'StudyRide — Android App Redesign'
    })
  });

  const projData = await projRes.json();
  console.log('Project response:', projData);

  if (projData.id) {
    const fileRes = await fetch('https://design.penpot.app/api/rpc/command/create-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        projectId: projData.id,
        name: 'StudyRide — Android Mobile Experience & Design System'
      })
    });
    const fileData = await fileRes.json();
    console.log('File response:', fileData);
  }
}

createNewProjectAndFile().catch(console.error);
