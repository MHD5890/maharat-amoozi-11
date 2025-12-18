const fetch = require('node-fetch');

async function testMehtaSkillsAPI() {
    const baseURL = 'http://localhost:3000/api/mehta-skills';
    const adminPass = 'maharat123'; // assuming this is the pass

    try {
        // First, get existing skills
        console.log('Fetching existing Mehta skills...');
        const getRes = await fetch(`${baseURL}?pass=${encodeURIComponent(adminPass)}`);
        const getData = await getRes.json();
        console.log('GET response:', getData);

        if (!getData.success || !getData.data.length) {
            console.log('No skills found, creating one for test...');
            const createRes = await fetch(`${baseURL}?pass=${encodeURIComponent(adminPass)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill: 'مهتا ۱' })
            });
            const createData = await createRes.json();
            console.log('POST response:', createData);
            if (!createData.success) return;
        }

        // Get the first skill
        const skill = getData.data[0] || createData.data;
        const skillName = skill.skill;
        console.log('Testing with skill:', skillName);

        // Test update with encoded ID
        const encodedId = encodeURIComponent(skillName);
        console.log('Encoded ID:', encodedId);
        const updateRes = await fetch(`${baseURL}/${encodedId}?pass=${encodeURIComponent(adminPass)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skill: 'مهتا ۱ بروزرسانی' })
        });
        const updateData = await updateRes.json();
        console.log('PUT response:', updateData);

        // Test delete with encoded ID
        const deleteRes = await fetch(`${baseURL}/${encodeURIComponent('مهتا ۱ بروزرسانی')}?pass=${encodeURIComponent(adminPass)}`, {
            method: 'DELETE'
        });
        const deleteData = await deleteRes.json();
        console.log('DELETE response:', deleteData);

    } catch (err) {
        console.error('Test error:', err);
    }
}

testMehtaSkillsAPI();
