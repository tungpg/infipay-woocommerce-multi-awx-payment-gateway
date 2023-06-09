jQuery(function ($) {
    var infipay_awx_checkout_form = $('form.checkout');

    function loadAwxPaymentProcess() {
        setTimeout(function () {
            if (!window.infipay_awx_checkout_error) {
                infipay_awx_checkout_form.removeClass('processing').unblock();
                $('#cs-awx-loader').show();
                setTimeout((function () {
                    $('#cs-awx-loader').hide();
                }), 30000);
            }
        }, 1000)
    }

    $(document).on('checkout_error', function () {
        if ($('input[name="payment_method"]:checked').val() == 'infipay_awx') {
            $('#cs-awx-loader').hide();
            window.infipay_awx_checkout_error = true;
        }
    })
    $('body').on('click', '#place_order', function (e) {
        if ($('input[name="payment_method"]:checked').val() == 'infipay_awx') {
            window.infipay_awx_checkout_error = false;
            e.preventDefault();
            if (validateFormCheckout()) {
                $('#awx-payment-area')[0].contentWindow.postMessage({
                    name: 'infipay-submitFormAirwallex',
                    value: {
                        billing_details: {
							payment_id:$('#payment_id').val(),
                            payment_descriptor:$('#payment_descriptor').val(),
                            first_name:$('#billing_first_name').val(),
                            last_name:$('#billing_last_name').val(),
                            email: $('#billing_email').val(),
                            city: $('#billing_city').val(),
                            country: $('#billing_country').val(),
                            line1: $('#billing_address_1').val(),
                            line2: $('#billing_address_2').val(),
                            postal_code: $('#billing_postcode').val(),
                            state: $('#billing_state').val(),
                            phone: $('#billing_phone').val(),
                            totalprice:ajax_object.order_total
                        }
                    }
                }, '*')
            } else {
                infipay_awx_checkout_form.submit()
            }
        }
    })

    $(document.body).on('updated_checkout', function (data) {
        if (!window.loadedPaymentFormAirwallex && $('input[name="payment_method"]:checked').val() == 'infipay_awx') {
            $('.woocommerce-checkout-payment').block({
                message: null,
                overlayCSS: {
                    background: '#fff',
                    opacity: 0.6
                }
            });
        }
    });
    /*
    event from proxy iframe
     */
    if (window.addEventListener) {
        window.addEventListener("message", listener);
    } else {
        window.attachEvent("onmessage", listener);
    }

    function blockOnSubmit(form) {
        var isBlocked = form.data('blockUI.isBlocked');

        if (1 !== isBlocked) {
            form.block({
                message: null,
                overlayCSS: {
                    background: '#fff',
                    opacity: 0.6
                }
            });
        }
    }

    function listener(event) {
        if (event.data === 'infipay-loadedPaymentFormAirwallex') {
            window.loadedPaymentFormAirwallex = true;
            $('.woocommerce-checkout-payment').unblock();
        }
        if (event.data === "infipay-startSubmitPaymentAirwallex") {
            blockOnSubmit(infipay_awx_checkout_form);
            //infipay_awx_checkout_form.addClass('processing')
            loadAwxPaymentProcess();
        }
        if (event.data === "infipay-endSubmitPaymentAirwallex") {
            infipay_awx_checkout_form.removeClass('processing').unblock();
            $('#cs-awx-loader').hide();
        }
        if (event.data === 'infipay-paymentFormCompletedAirwallex') {
            window.paymentFormCompletedAirwallex = true;
        }

        if (event.data === 'infipay-paymentFormFailAirwallex') {
            window.paymentFormCompletedAirwallex = false;
        }
        if ((typeof event.data === 'object') && event.data.name === 'infipay-errorSubmitPaymentAirwallex') {
            console.log(event.data);
            infipay_awx_checkout_form.removeClass('processing').unblock();
            $('#cs-awx-loader').hide();
            
            if(event.data.value != null){
				checkout_error(event.data.value);
			}else{
	            checkout_error('We cannot process your payment right now, please try another payment method.[3]');
			}
        }
        if ((typeof event.data === 'object') && event.data.name === 'infipay-successSubmitPaymentAirwallex') {
			//alert(JSON.stringify(event.data));
            var paymentIntentId = event.data.value.id;
            var merchantOrderId = event.data.value.merchant_order_id;
            
            if (infipay_awx_checkout_form.find('[name="infipay-awx-payment-intent-id"]')) {
                infipay_awx_checkout_form.find('[name="infipay-awx-payment-intent-id"]').remove();
            }
            
            if (infipay_awx_checkout_form.find('[name="infipay-awx-payment-merchant-order-id"]')) {
                infipay_awx_checkout_form.find('[name="infipay-awx-payment-merchant-order-id"]').remove();
            }
            
            infipay_awx_checkout_form.append('<input style="display:none;" name="infipay-awx-payment-intent-id" value="' + paymentIntentId + '"/>');
            infipay_awx_checkout_form.append('<input style="display:none;" name="infipay-awx-payment-merchant-order-id" value="' + merchantOrderId + '"/>');
            infipay_awx_checkout_form.removeClass('processing').unblock();
            infipay_awx_checkout_form.submit();
            
            if (validateFormCheckout()) {
                loadAwxPaymentProcess();
            }
        }
        /*if ((typeof event.data === 'object') && event.data.name === 'infipay-paymentIntentIdAirwallex') {
            var paymentIntentId = event.data.value;
            if (infipay_awx_checkout_form.find('[name="infipay-awx-payment-intent-id"]')) {
                infipay_awx_checkout_form.find('[name="infipay-awx-payment-intent-id"]').remove();
            }
            infipay_awx_checkout_form.append('<input style="display:none;" name="infipay-awx-payment-intent-id" value="' + paymentIntentId + '"/>');
            infipay_awx_checkout_form.removeClass('processing').unblock();
            $('form.checkout').submit();
            if (validateFormCheckout()) {
                loadAwxPaymentProcess();
            }
        }*/
    }

    function checkout_error(error_message) {
        $('.woocommerce-NoticeGroup-checkout, .woocommerce-error, .woocommerce-message').remove();
        infipay_awx_checkout_form.prepend('<div class="woocommerce-NoticeGroup woocommerce-NoticeGroup-checkout">' +
            '<ul class="woocommerce-error">' +
            '<li data-id="checkout_error">' + error_message + '' +
            '</li>' +
            '</ul>' +
            '</div>'); // eslint-disable-line max-len
        infipay_awx_checkout_form.removeClass('processing').unblock();
        infipay_awx_checkout_form.find('.input-text, select, input:checkbox').trigger('validate').trigger('blur');
        var scrollElement = $('.woocommerce-NoticeGroup-updateOrderReview, .woocommerce-NoticeGroup-checkout');
        if (!scrollElement.length) {
            scrollElement = $('form.checkout');
        }
        $.scroll_to_notices(scrollElement);
        $(document.body).trigger('checkout_error', [error_message]);
    }

    function checkFieldValidated(target) {
        var isNotInvalid = !target.closest('.form-row').hasClass('woocommerce-invalid');
        var isNotEmpty = true;
        if (target.closest('.form-row').hasClass('validate-required')) {
            isNotEmpty = (typeof target.val() == 'string') ? target.val().length : false;
        }
        return isNotInvalid && isNotEmpty;
    }

    function validateFormCheckout() {
        return checkFieldValidated($('#billing_first_name')) &&
            checkFieldValidated($('#billing_last_name')) &&
            checkFieldValidated($('#billing_email')) &&
            checkFieldValidated($('#billing_city')) &&
            checkFieldValidated($('#billing_country')) &&
            checkFieldValidated($('#billing_postcode')) &&
            checkFieldValidated($('#billing_address_1')) &&
            checkFieldValidated($('#billing_address_2')) &&
            checkFieldValidated($('#billing_phone')) &&
            $('input[name="payment_method"]:checked').val() == 'infipay_awx';
    }
});