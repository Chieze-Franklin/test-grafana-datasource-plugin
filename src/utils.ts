import { getBackendSrv } from '@grafana/runtime';

let proxyUrl: string | undefined = '';

export async function fetchApiData(url: string) {
  const result = await getBackendSrv()
    .datasourceRequest({
      method: 'GET',
      url,
      headers: {
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxHRUpobXVFU1BYbFBocDNCdWI5dyJ9.eyJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9lbWFpbCI6ImZyYW5rbGluQGNhbHlwdGlhLmNvbSIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL2VtYWlsX3ZlcmlmaWVkIjp0cnVlLCJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9mYW1pbHlfbmFtZSI6IkNoaWV6ZSIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL2dpdmVuX25hbWUiOiJGcmFua2xpbiAiLCJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9uYW1lIjoiRnJhbmtsaW4gQ2hpZXplIiwiaHR0cHM6Ly9jbG91ZC5jYWx5cHRpYS5jb20vbmlja25hbWUiOiJmcmFua2xpbiIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL3BpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHaUwzLVRGUnQ2RG8zMVlnNXlJc1hXdzJ4cTJXVEVEb3BsMTduajc9czk2LWMiLCJpc3MiOiJodHRwczovL3Nzby5jYWx5cHRpYS5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDM2OTk4OTQ1MTI5OTE3MjY1OTQiLCJhdWQiOlsiaHR0cHM6Ly9jb25maWcuY2FseXB0aWEuY29tIiwiaHR0cHM6Ly9kZXYtMTVzbWpoLWUudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY1MDkwODMzOCwiZXhwIjoxNjUxNDY4MzM4LCJhenAiOiJoT0R0dkMzb09RVndUOElMeG9RRnY1ZVJ0Z0Vsc2RGaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MifQ.CZ3rMG9L6tjzZCjq92MIrRxCNXzrNfr0BP_0I-NU2p25qfvp4GiUMnqbLvlLEc50xissREuHl7jvL3oGMZpGizWWWzmcv0s68UnPazmKfG0eyLIR2Q-BDNjRKPAomBx4mYqxvVjUVPKIDg_ibi7SY4rR_UDIJLCKvhXfBw8l46zoLe302OPaDAbYLNxXSnHEo-GH5r5N_B-_p8Omh74xE5sHrX5TZ-z_MRrgFKiMp5Twk7DJXPkMPnv8wIbagCI4gD7cjuMn7CQLv-XOpSCx7ax-dhu-LpkwfBCGe_4ygnSjCEOvH8aqM_Rho6IkZNjlcRb2STHJ_u3TFyWk4SLn0g',
      },
    })
    .catch((e) => {
      console.log('>>>>>>>>>>>>>>>>>>>>>>error in dorequest');
      console.log(e);
    });
  return result;
}

export function getProxyUrl() {
  return proxyUrl;
}

export function setProxyUrl(url?: string) {
  proxyUrl = url;
}

export function makePhrase(word: string) {
  return word.replace(/_/g, ' ').replace(/\./g, ' ');
}
