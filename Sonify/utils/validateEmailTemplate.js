export const generateValidationEmail = ({
    username,
    validateURL,
    logoUrl = 'images/SonifyPreview.png',
    supportEmail = 'support@sonify.zeaky.dev',
    companyName = 'Sonify',
    copyrightYear = '2025',
  }) => {
    if (!username || !validateURL) {
      throw new Error('Username and validateURL are required.');
    }
  
    const logoAltText = `${companyName} Logo`;
  
    return `<!DOCTYPE html>
  <html
    lang="en"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:v="urn:schemas-microsoft-com:vml"
  >
    <head>
      <title>Validate Your ${companyName} Account</title>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      <!--[if mso]>
        <xml
          ><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"
            ><w:DontUseAdvancedTypographyReadingMail
          /></w:WordDocument>
          <o:OfficeDocumentSettings
            ><o:PixelsPerInch>96</o:PixelsPerInch
            ><o:AllowPNG /></o:OfficeDocumentSettings
        ></xml>
      <![endif]-->
      <!--[if !mso]><!-->
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900"
        rel="stylesheet"
        type="text/css"
      />
      <!--<![endif]-->
      <style>
        * {
          box-sizing: border-box;
        }
  
        body {
          margin: 0;
          padding: 0;
        }
  
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: inherit !important;
        }
  
        #MessageViewBody a {
          color: inherit;
          text-decoration: none;
        }
  
        p {
          line-height: inherit;
        }
  
        .desktop_hide,
        .desktop_hide table {
          mso-hide: all;
          display: none;
          max-height: 0px;
          overflow: hidden;
        }
  
        .image_block img + div {
          display: none;
        }
  
         /* Custom styles for the validation button link */
        .validation-button-link {
            background-color: #d395ff;
            border-bottom: 0px solid transparent;
            border-left: 0px solid transparent;
            border-radius: 15px;
            border-right: 0px solid transparent;
            border-top: 0px solid transparent;
            color: #ffffff !important; /* Ensure link color is white */
            display: inline-block;
            font-family: 'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;
            font-size: 13px;
            font-weight: 700;
            mso-border-alt: none;
            padding: 10px 20px; /* Combined padding */
            text-align: center;
            text-decoration: none; /* Remove underline */
            width: auto;
            word-break: keep-all;
            letter-spacing: normal;
        }
  
         .validation-button-link span {
            /* Styles specific to the inner span if needed, but most are on the <a> */
            word-break: break-word;
            line-height: 26px;
            color: #ffffff; /* Ensure text color is white */
            text-decoration: none; /* Remove underline */
        }
  
  
        sup,
        sub {
          font-size: 75%;
          line-height: 0;
        }
  
        @media (max-width: 500px) {
          .desktop_hide table.icons-inner {
            display: inline-block !important;
          }
  
          .icons-inner {
            text-align: center;
          }
  
          .icons-inner td {
            margin: 0 auto;
          }
  
          .mobile_hide {
            display: none;
          }
  
          .row-content {
            width: 100% !important;
          }
  
          .stack .column {
            width: 100%;
            display: block;
          }
  
          .mobile_hide {
            min-height: 0;
            max-height: 0;
            max-width: 0;
            overflow: hidden;
            font-size: 0px;
          }
  
          .desktop_hide,
          .desktop_hide table {
            display: table !important;
            max-height: none !important;
          }
        }
      </style>
      <!--[if mso
        ]><style>
          sup,
          sub {
            font-size: 100% !important;
          }
          sup {
            mso-text-raise: 10%;
          }
          sub {
            mso-text-raise: -10%;
          }
           /* Ensure VML button text is white */
          .vml-button-text {
            color: #ffffff !important;
          }
        </style>
      <![endif]-->
    </head>
    <body
      class="body"
      style="
        margin: 0;
        background-color: #ffffff;
        padding: 0;
        -webkit-text-size-adjust: none;
        text-size-adjust: none;
      "
    >
      <table
        border="0"
        cellpadding="0"
        cellspacing="0"
        class="nl-container"
        role="presentation"
        style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          background-color: #ffffff;
          background-image: none;
          background-position: top left;
          background-size: auto;
          background-repeat: no-repeat;
        "
        width="100%"
      >
        <tbody>
          <tr>
            <td>
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                class="row row-1"
                role="presentation"
                style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                width="100%"
              >
                <tbody>
                  <tr>
                    <td>
                      <table
                        align="center"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        class="row-content stack"
                        role="presentation"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          background-color: #09030d;
                          color: #000000;
                          width: 480px;
                          margin: 0 auto;
                        "
                        width="480"
                      >
                        <tbody>
                          <tr>
                            <td
                              class="column column-1"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                font-weight: 400;
                                text-align: left;
                                padding-bottom: 5px;
                                padding-top: 5px;
                                vertical-align: top;
                              "
                              width="100%"
                            >
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="image_block block-1"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td
                                    class="pad"
                                    style="
                                      width: 100%;
                                      padding-right: 0px;
                                      padding-left: 0px;
                                      padding-top: 20px; /* Added some top padding */
                                    "
                                  >
                                    <div align="center" class="alignment">
                                      <div style="max-width: 168px">
                                        <!-- CUSTOMIZABLE LOGO URL -->
                                        <img
                                          alt="${logoAltText}"
                                          height="auto"
                                          src="${logoUrl}"
                                          style="
                                            display: block;
                                            height: auto;
                                            border: 0;
                                            width: 100%;
                                          "
                                          title="${companyName}"
                                          width="168"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="paragraph_block block-2"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  word-break: break-word;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td
                                    class="pad"
                                    style="
                                      padding-bottom: 20px;
                                      padding-left: 50px;
                                      padding-right: 50px;
                                      padding-top: 50px;
                                    "
                                  >
                                    <div
                                      style="
                                        color: #fff;
                                        direction: ltr;
                                        font-family: 'Montserrat', 'Trebuchet MS',
                                          'Lucida Grande', 'Lucida Sans Unicode',
                                          'Lucida Sans', Tahoma, sans-serif;
                                        font-size: 13px;
                                        font-weight: 400;
                                        letter-spacing: 0px;
                                        line-height: 1.2;
                                        text-align: justify; /* Justify looks better for body text */
                                        mso-line-height-alt: 16px;
                                      "
                                    >
                                      <!-- CUSTOMIZABLE USERNAME -->
                                      <p style="margin: 0; margin-bottom: 16px">
                                        Dear <em><strong>${username}</strong></em>,
                                      </p>
                                      <p style="margin: 0; margin-bottom: 16px">
                                         
                                      </p>
                                      <!-- CUSTOMIZABLE COMPANY NAME -->
                                      <p style="margin: 0; margin-bottom: 16px">
                                        Thank you for joining
                                        <strong>${companyName}</strong>, our vibrant
                                        community of music enthusiasts! We’re
                                        absolutely thrilled to have you on board
                                        and can’t wait to share incredible musical
                                        experiences with you.
                                      </p>
                                      <p style="margin: 0; margin-bottom: 16px">
                                        To complete your registration and gain
                                        full access to all our features, please
                                        validate your email address by clicking
                                        the “Validate Now” button below.
                                      </p>
                                      <p style="margin: 0; margin-bottom: 16px">
                                         
                                      </p>
                                      <p style="margin: 0; margin-bottom: 16px">
                                        By verifying your email, you’ll unlock
                                        curated playlists, connect with fellow
                                        music lovers, and enjoy exclusive content
                                        tailored just for you.
                                      </p>
                                      <!-- CUSTOMIZABLE SUPPORT EMAIL -->
                                      <p style="margin: 0; margin-bottom: 16px">
                                        Should you encounter any issues during the
                                        validation process or have any questions,
                                        our dedicated support team is here to
                                        help. Feel free to reach out to us at
                                        <strong>${supportEmail}</strong>.
                                      </p>
                                      <p style="margin: 0; margin-bottom: 16px">
                                         
                                      </p>
                                      <!-- CUSTOMIZABLE COMPANY NAME -->
                                      <p style="margin: 0">
                                        Once again, welcome to
                                        <strong>${companyName}</strong>! We’re excited for
                                        you to embark on this fantastic musical
                                        journey with us.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                               <table
                                border="0"
                                cellpadding="10"
                                cellspacing="0"
                                class="button_block block-3"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td class="pad">
                                    <div align="center" class="alignment">
                                      <!--[if mso]>
                                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${validateURL}" style="height:46px;width:130px;v-text-anchor:middle;" arcsize="33%" fillcolor="#d395ff" strokecolor="#d395ff">
                                      <w:anchorlock/>
                                      <center dir="false" style="color:#ffffff;font-family:'Trebuchet MS', Tahoma, sans-serif;font-size:13px;font-weight:700;">
                                      <![endif]-->
                                      <!-- CUSTOMIZABLE VALIDATION URL -->
                                      <a
                                        href="${validateURL}"
                                        target="_blank"
                                        class="validation-button-link"
                                        style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#d395ff;border-radius:15px;width:auto;border-top:0px solid transparent;font-weight:700;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:10px;padding-bottom:10px;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;font-size:13px;text-align:center;mso-border-alt:none;word-break:keep-all;"
                                        >
                                         <span style="padding-left:20px;padding-right:20px;font-size:13px;display:inline-block;letter-spacing:normal;">
                                            <span style="word-break: break-word; line-height: 26px;">Validate Now</span>
                                         </span>
                                      </a
                                      >
                                      <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="paragraph_block block-4"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  word-break: break-word;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td class="pad" style="padding-top: 10px;"> <!-- Added padding top -->
                                    <div
                                      style="
                                        color: #fff;
                                        direction: ltr;
                                        font-family: 'Montserrat', 'Trebuchet MS',
                                          'Lucida Grande', 'Lucida Sans Unicode',
                                          'Lucida Sans', Tahoma, sans-serif;
                                        font-size: 13px;
                                        font-weight: 400;
                                        letter-spacing: 0px;
                                        line-height: 1.2;
                                        text-align: center;
                                        mso-line-height-alt: 16px;
                                      "
                                    >
                                      <p style="margin: 0">
                                        If the button isn’t working, try 
                                        <!-- CUSTOMIZABLE VALIDATION URL -->
                                        <a
                                          href="${validateURL}"
                                          rel="noopener"
                                          style="
                                            text-decoration: underline;
                                            color: #d395ff; /* Make link standout */
                                            word-break: break-all; /* Break long URLs */
                                          "
                                          target="_blank"
                                          >this link.</a>
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="paragraph_block block-5"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  word-break: break-word;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td
                                    class="pad"
                                    style="
                                      padding-bottom: 50px;
                                      padding-left: 50px;
                                      padding-right: 50px;
                                      padding-top: 25px;
                                    "
                                  >
                                    <div
                                      style="
                                        color: #fff;
                                        direction: ltr;
                                        font-family: 'Montserrat', 'Trebuchet MS',
                                          'Lucida Grande', 'Lucida Sans Unicode',
                                          'Lucida Sans', Tahoma, sans-serif;
                                        font-size: 13px;
                                        font-weight: 400;
                                        letter-spacing: 0px;
                                        line-height: 1.5;
                                        text-align: left; /* Keep left align for signature */
                                        mso-line-height-alt: 20px;
                                      "
                                    >
                                      <!-- CUSTOMIZABLE COMPANY NAME -->
                                      <p style="margin: 0">
                                        Best regards,<br /><strong>The ${companyName} Team</strong>
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="paragraph_block block-6"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  word-break: break-word;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td
                                    class="pad"
                                    style="
                                      padding-bottom: 10px;
                                      padding-left: 10px;
                                      padding-right: 10px;
                                      padding-top: 60px;
                                    "
                                  >
                                    <div
                                      style="
                                        color: #737373;
                                        direction: ltr;
                                        font-family: 'Montserrat', 'Trebuchet MS',
                                          'Lucida Grande', 'Lucida Sans Unicode',
                                          'Lucida Sans', Tahoma, sans-serif;
                                        font-size: 10px;
                                        font-weight: 400;
                                        letter-spacing: 0px;
                                        line-height: 1.2;
                                        text-align: center;
                                        mso-line-height-alt: 12px;
                                      "
                                    >
                                      <!-- CUSTOMIZABLE COMPANY NAME & COPYRIGHT YEAR -->
                                      <p style="margin: 0">
                                        All rights reserved © ${companyName}, ${copyrightYear}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                class="row row-2"
                role="presentation"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  background-color: #ffffff;
                "
                width="100%"
              >
                <tbody>
                  <tr>
                    <td>
                      <table
                        align="center"
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        class="row-content stack"
                        role="presentation"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          background-color: #09030d; /* Match footer background */
                          color: #000000;
                          width: 480px;
                          margin: 0 auto;
                        "
                        width="480"
                      >
                        <tbody>
                          <tr>
                            <td
                              class="column column-1"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                font-weight: 400;
                                text-align: left;
                                padding-bottom: 5px;
                                padding-top: 5px;
                                vertical-align: top;
                              "
                              width="100%"
                            >
                              <table
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                class="icons_block block-1"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  text-align: center;
                                  line-height: 0;
                                "
                                width="100%"
                              >
                                <tr>
                                  <td
                                    class="pad"
                                    style="
                                      vertical-align: middle;
                                      color: #1e0e4b;
                                      font-family: 'Inter', sans-serif;
                                      font-size: 15px;
                                      padding-bottom: 5px;
                                      padding-top: 5px;
                                      text-align: center;
                                    "
                                  >
                                    <!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
                                    <!--[if !vml]><!-->
                                    <table
                                      cellpadding="0"
                                      cellspacing="0"
                                      class="icons-inner"
                                      role="presentation"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        display: inline-block;
                                        padding-left: 0px;
                                        padding-right: 0px;
                                      "
                                    >
                                      <!--<![endif]-->
                                      <tr>
                                       <!-- Optional: Add social media icons or other footer content here -->
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- End -->
    </body>
  </html>
  `;
  };
  
  // --- Example Usage ---
  /*
  // In another file (e.g., sendEmail.js)
  import { generateValidationEmail } from './ValidateEmail.js';
  
  const user = {
    name: 'Charlie Chaplin',
    validationLink: 'https://app.sonify.zeaky.dev/validate?token=def456uvw123',
    customLogo: 'https://my-cdn.com/assets/new-logo-email.png' // Example using a CDN URL
  };
  
  const emailHtml = generateValidationEmail({
    username: user.name,
    validateURL: user.validationLink,
    logoUrl: user.customLogo, // Provide the custom logo URL here
    companyName: 'My Awesome Music Service',
    copyrightYear: new Date().getFullYear().toString(), // Dynamic year
    supportEmail: 'help@myawesomemusicservice.com'
  });
  
  // Send emailHtml using your email service
  // console.log(emailHtml);
  */